import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Reply } from './reply.entity';
import { MessageStatus } from '../message/message.entity';
import { User, UserStatus } from '../user/user.entity';
import { Message } from '../message/message.entity';
import { IdGenerator } from '../../utils/id-generator';
import { redisClient, REDIS_KEYS } from '../../database/redis';
import { SendMessageDto } from '../../common/dto/message.dto';

@Injectable()
export class ReplyService {
  constructor(
    @InjectRepository(Reply)
    private replyRepository: Repository<Reply>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  /**
   * 发送回复
   */
  async sendReply(userId: string, msgId: string, dto: SendMessageDto): Promise<any> {
    const { content, mediaUrls } = dto;

    // 1. 查找原始留言
    const message = await this.messageRepository.findOne({ where: { msgId } });
    if (!message) {
      throw new BadRequestException('留言不存在');
    }

    // 2. 验证权限（只有留言接收者可以回复）
    if (message.receiverId !== userId) {
      throw new BadRequestException('无权回复该留言');
    }

    // 3. 检查用户状态
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user || user.status !== UserStatus.NORMAL) {
      throw new BadRequestException('账户状态异常');
    }

    // 4. 检查每日回复限制（5条）
    const today = new Date().toISOString().split('T')[0];
    const recvLimitKey = `${REDIS_KEYS.DAILY_RECV_LIMIT}:${userId}:${today}`;
    const recvCount = await redisClient.get(recvLimitKey);
    if (recvCount && parseInt(recvCount) >= 5) {
      throw new BadRequestException('今日回复次数已达上限');
    }

    // 5. 内容审核
    const auditResult = await this.auditContent(content, mediaUrls);
    if (!auditResult.passed) {
      throw new BadRequestException(`回复未通过审核：${auditResult.reason}`);
    }

    // 6. 创建回复记录
    const replyId = IdGenerator.generateReplyId();
    const reply = this.replyRepository.create({
      replyId,
      msgId,
      senderId: userId,
      receiverId: message.senderId, // 回复给留言发送者
      contentType: mediaUrls?.length > 0 ? 2 : 1,
      content,
      mediaUrls,
      status: MessageStatus.APPROVED,
    });

    await this.replyRepository.save(reply);

    // 7. 增加回复计数
    await redisClient.incr(recvLimitKey);
    await redisClient.expire(recvLimitKey, 86400);

    return { replyId };
  }

  /**
   * 获取用户收到的回复
   */
  async getUserReplies(userId: string): Promise<any[]> {
    const replies = await this.replyRepository.find({
      where: { receiverId: userId },
      order: { createdAt: 'DESC' },
    });

    // 获取关联留言和发送者信息
    const msgIds = replies.map(r => r.msgId);
    const messages = await this.messageRepository.find({
      where: { msgId: In(msgIds) },
      select: ['msgId', 'content', 'mediaUrls'],
    });

    const senderIds = replies.map(r => r.senderId);
    const senders = await this.userRepository.find({
      where: { userId: In(senderIds) },
      select: ['userId', 'nickname', 'avatarUrl'],
    });

    const messageMap = new Map(messages.map(m => [m.msgId, m]));
    const senderMap = new Map(senders.map(s => [s.userId, s]));

    return replies.map(reply => ({
      replyId: reply.replyId,
      msgId: reply.msgId,
      senderId: reply.senderId,
      senderNickname: senderMap.get(reply.senderId)?.nickname || '匿名',
      senderAvatarUrl: senderMap.get(reply.senderId)?.avatarUrl,
      contentType: reply.contentType,
      content: reply.content,
      mediaUrls: reply.mediaUrls,
      originalMessage: messageMap.get(reply.msgId),
      createdAt: reply.createdAt,
    }));
  }

  /**
   * 内容审核（复用留言的审核逻辑）
   */
  private async auditContent(content: string, mediaUrls: string[]): Promise<{ passed: boolean; reason?: string }> {
    // 1. 敏感词检测
    if (content) {
      const words = await redisClient.smembers(REDIS_KEYS.SENSITIVE_WORDS);
      for (const word of words) {
        if (content.includes(word)) {
          return { passed: false, reason: '内容包含敏感词' };
        }
      }
    }

    // 2. 联系方式检测
    if (content) {
      const patterns = [
        /微信[\s:：]*[a-zA-Z0-9_-]{5,}/i,
        /wx[\s:：]*[a-zA-Z0-9_-]{5,}/i,
        /1[3-9]\d{9}/,
        /https?:\/\/[^\s]+/i,
      ];
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return { passed: false, reason: '内容包含联系方式' };
        }
      }
    }

    return { passed: true };
  }
}
