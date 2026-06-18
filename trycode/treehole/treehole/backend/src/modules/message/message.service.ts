import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Message, MessageStatus, ContentType } from './message.entity';
import { User, UserStatus } from '../user/user.entity';
import { IdGenerator } from '../../utils/id-generator';
import { CoordinateService } from '../coordinate/coordinate.service';
import { redisClient, REDIS_KEYS } from '../../database/redis';
import { SendMessageDto } from '../../common/dto/message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private coordinateService: CoordinateService,
    private dataSource: DataSource,
  ) {}

  /**
   * 发送留言
   */
  async sendMessage(senderId: string, dto: SendMessageDto): Promise<any> {
    const { content, mediaUrls, isAnonymous } = dto;

    // 1. 检查用户状态
    const sender = await this.userRepository.findOne({ where: { userId: senderId } });
    if (!sender || sender.status !== UserStatus.NORMAL) {
      throw new BadRequestException('账户状态异常，无法发送留言');
    }

    // 2. 检查每日发送限制（3条）
    const today = new Date().toISOString().split('T')[0];
    const sendLimitKey = `${REDIS_KEYS.DAILY_SEND_LIMIT}:${senderId}:${today}`;
    const sendCount = await redisClient.get(sendLimitKey);
    if (sendCount && parseInt(sendCount) >= 3) {
      throw new BadRequestException('今日发送留言次数已达上限');
    }

    // 3. 内容审核
    const auditResult = await this.auditContent(content, mediaUrls);
    if (!auditResult.passed) {
      throw new BadRequestException(`留言未通过审核：${auditResult.reason}`);
    }

    // 4. 随机选择接收者
    const receiver = await this.selectReceiver(senderId);
    if (!receiver) {
      throw new BadRequestException('系统繁忙，暂时找不到接收者，请稍后再试');
    }

    // 5. 创建留言记录
    const msgId = IdGenerator.generateMsgId();
    const message = this.messageRepository.create({
      msgId,
      senderId,
      receiverId: receiver.userId,
      coordId: receiver.currentCoordId,
      contentType: mediaUrls?.length > 0 ? (dto.contentType || ContentType.TEXT) : ContentType.TEXT,
      content,
      mediaUrls,
      isAnonymous: isAnonymous ? 1 : 0,
      status: MessageStatus.APPROVED,
      expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后过期
    });

    await this.messageRepository.save(message);

    // 6. 增加发送计数
    await redisClient.incr(sendLimitKey);
    await redisClient.expire(sendLimitKey, 86400);

    // 7. 增加坐标热度
    await this.coordinateService.increaseHeat(receiver.currentCoordId, 2);

    return { msgId };
  }

  /**
   * 获取坐标留言列表
   */
  async getCoordinateMessages(userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const coordId = user.currentCoordId;
    if (!coordId) {
      return [];
    }

    // 查询该坐标下未读且未过期的留言
    const messages = await this.messageRepository.find({
      where: {
        receiverId: userId,
        coordId,
        status: MessageStatus.APPROVED,
        isRead: 0,
        expireAt: new Date(Date.now() + 86400000), // 只查看当天及之前的留言
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // 获取发送者信息
    const senderIds = messages.map(m => m.senderId);
    const senders = await this.userRepository.find({
      where: { userId: In(senderIds) },
      select: ['userId', 'nickname', 'avatarUrl'],
    });

    const senderMap = new Map(senders.map(s => [s.userId, s]));

    return messages.map(msg => {
      const sender = senderMap.get(msg.senderId);
      return {
        msgId: msg.msgId,
        senderId: msg.senderId,
        senderNickname: msg.isAnonymous ? '匿名' : (sender?.nickname || '匿名'),
        senderAvatarUrl: msg.isAnonymous ? null : sender?.avatarUrl,
        contentType: msg.contentType,
        content: msg.content,
        mediaUrls: msg.mediaUrls,
        createdAt: msg.createdAt,
      };
    });
  }

  /**
   * 获取留言详情
   */
  async getMessageDetail(userId: string, msgId: string): Promise<any> {
    const message = await this.messageRepository.findOne({ where: { msgId } });
    if (!message) {
      throw new BadRequestException('留言不存在');
    }

    if (message.receiverId !== userId && message.senderId !== userId) {
      throw new BadRequestException('无权查看该留言');
    }

    // 获取发送者信息
    const sender = await this.userRepository.findOne({
      where: { userId: message.senderId },
      select: ['userId', 'nickname', 'avatarUrl'],
    });

    return {
      msgId: message.msgId,
      senderId: message.senderId,
      senderNickname: message.isAnonymous ? '匿名' : (sender?.nickname || '匿名'),
      senderAvatarUrl: message.isAnonymous ? null : sender?.avatarUrl,
      coordId: message.coordId,
      contentType: message.contentType,
      content: message.content,
      mediaUrls: message.mediaUrls,
      createdAt: message.createdAt,
      isRead: message.isRead,
      readAt: message.readAt,
    };
  }

  /**
   * 标记留言已读
   */
  async markAsRead(userId: string, msgId: string): Promise<void> {
    const message = await this.messageRepository.findOne({ where: { msgId } });
    if (!message || message.receiverId !== userId) {
      return;
    }

    if (message.isRead === 0) {
      message.isRead = 1;
      message.readAt = new Date();
      await this.messageRepository.save(message);
    }
  }

  /**
   * 选择接收者（随机选择活跃用户）
   */
  private async selectReceiver(excludeUserId: string): Promise<User | null> {
    // 查询最近7天活跃的用户
    const activeUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.userId != :excludeUserId', { excludeUserId })
      .andWhere('user.status = :status', { status: UserStatus.NORMAL })
      .andWhere('user.lastLoginTime > :date', { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) })
      .orderBy('RAND()')
      .take(100)
      .getMany();

    if (activeUsers.length === 0) {
      // 没有活跃用户，随机选择一个正常用户
      const users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.userId != :excludeUserId', { excludeUserId })
        .andWhere('user.status = :status', { status: UserStatus.NORMAL })
        .orderBy('RAND()')
        .take(10)
        .getMany();

      if (users.length === 0) {
        return null;
      }

      return users[Math.floor(Math.random() * users.length)];
    }

    return activeUsers[Math.floor(Math.random() * activeUsers.length)];
  }

  /**
   * 内容审核
   */
  private async auditContent(content: string, mediaUrls: string[]): Promise<{ passed: boolean; reason?: string }> {
    // 1. 敏感词检测
    if (content) {
      const hasSensitive = await this.checkSensitiveWords(content);
      if (hasSensitive) {
        return { passed: false, reason: '内容包含敏感词' };
      }
    }

    // 2. 联系方式检测
    if (content) {
      const hasContact = this.checkContactInfo(content);
      if (hasContact) {
        return { passed: false, reason: '内容包含联系方式' };
      }
    }

    // 3. 图片/视频审核（调用第三方API，这里简化处理）
    // TODO: 集成腾讯云内容安全 API
    if (mediaUrls && mediaUrls.length > 0) {
      // 假设都通过审核
    }

    return { passed: true };
  }

  /**
   * 检查敏感词
   */
  private async checkSensitiveWords(content: string): Promise<boolean> {
    const words = await redisClient.smembers(REDIS_KEYS.SENSITIVE_WORDS);
    for (const word of words) {
      if (content.includes(word)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查联系方式
   */
  private checkContactInfo(content: string): boolean {
    const patterns = [
      /微信[\s:：]*[a-zA-Z0-9_-]{5,}/i,
      /wx[\s:：]*[a-zA-Z0-9_-]{5,}/i,
      /手机[\s:：]*\d{11}/,
      /电话[\s:：]*\d{11}/,
      /QQ[\s:：]*\d{5,}/i,
      /https?:\/\/[^\s]+/i,
      /www\.[^\s]+/i,
      /1[3-9]\d{9}/,
    ];

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取用户发送的留言
   */
  async getUserSentMessages(userId: string): Promise<any[]> {
    const messages = await this.messageRepository.find({
      where: { senderId: userId },
      order: { createdAt: 'DESC' },
    });

    return messages.map(msg => ({
      msgId: msg.msgId,
      contentType: msg.contentType,
      content: msg.content,
      mediaUrls: msg.mediaUrls,
      status: msg.status,
      isAnonymous: msg.isAnonymous,
      createdAt: msg.createdAt,
    }));
  }
}
