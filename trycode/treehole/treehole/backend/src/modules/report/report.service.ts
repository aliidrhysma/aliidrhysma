import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Report, ReportStatus, TargetType } from './report.entity';
import { User, UserStatus } from '../user/user.entity';
import { IdGenerator } from '../../utils/id-generator';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
   * 提交举报
   */
  async submitReport(reporterId: string, dto: { targetType: number; targetId: string; reason: string }): Promise<any> {
    const { targetType, targetId, reason } = dto;

    // 查找被举报用户
    const targetUser = await this.getReportedUser(targetType, targetId);
    if (!targetUser) {
      throw new BadRequestException('举报目标不存在');
    }

    // 不能举报自己
    if (targetUser.userId === reporterId) {
      throw new BadRequestException('不能举报自己');
    }

    // 创建举报记录
    const reportId = IdGenerator.generateReportId();
    const report = this.reportRepository.create({
      reportId,
      reporterId,
      reportedUserId: targetUser.userId,
      targetType,
      targetId,
      reason,
      status: ReportStatus.PENDING,
    });

    await this.reportRepository.save(report);

    // 增加被举报用户的举报次数
    targetUser.reportCount = (targetUser.reportCount || 0) + 1;
    await this.userRepository.save(targetUser);

    // 判断是否触发处罚
    await this.checkAndApplyPunishment(targetUser);

    return { reportId };
  }

  /**
   * 获取被举报用户
   */
  private async getReportedUser(targetType: number, targetId: string): Promise<User | null> {
    if (targetType === TargetType.MESSAGE) {
      const MessageEntity = require('../message/message.entity').Message;
      const message = await this.dataSource.getRepository(MessageEntity).findOne({ where: { msgId: targetId } });
      if (!message) return null;
      return this.userRepository.findOne({ where: { userId: message.senderId } });
    } else if (targetType === TargetType.REPLY) {
      const ReplyEntity = require('../reply/reply.entity').Reply;
      const reply = await this.dataSource.getRepository(ReplyEntity).findOne({ where: { replyId: targetId } });
      if (!reply) return null;
      return this.userRepository.findOne({ where: { userId: reply.senderId } });
    }
    return null;
  }

  /**
   * 检查并应用处罚
   */
  private async checkAndApplyPunishment(user: User): Promise<void> {
    const reportCount = user.reportCount || 0;

    // 每5次举报触发一次处罚
    if (reportCount % 5 === 0 && reportCount > 0) {
      const freezeCount = Math.floor(reportCount / 5);

      if (freezeCount === 1) {
        // 第一次：冻结5天
        user.status = UserStatus.FROZEN;
        user.freezeCount = user.freezeCount + 1;
        user.freezeUntil = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      } else if (freezeCount === 2) {
        // 第二次：冻结10天
        user.status = UserStatus.FROZEN;
        user.freezeCount = user.freezeCount + 1;
        user.freezeUntil = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      } else if (freezeCount >= 3) {
        // 第三次及以上：永久封禁
        user.status = UserStatus.BANNED;
        user.freezeCount = user.freezeCount + 1;
      }

      await this.userRepository.save(user);
    }
  }

  /**
   * 获取用户可举报的内容列表
   */
  async getReportableContent(userId: string): Promise<any> {
    // 返回用户可以举报的留言和回复
    return {
      message: '此接口预留，用于显示用户可举报的内容列表',
    };
  }
}
