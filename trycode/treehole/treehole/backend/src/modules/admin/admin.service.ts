import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from './admin.entity';
import { User } from '../user/user.entity';
import { Message } from '../message/message.entity';
import { Report } from '../report/report.entity';
import { AuthService } from '../auth/auth.service';
import { IdGenerator } from '../../utils/id-generator';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private authService: AuthService,
  ) {}

  /**
   * 管理员登录
   */
  async adminLogin(username: string, password: string): Promise<any> {
    const admin = await this.adminRepository.findOne({ where: { username } });
    if (!admin) {
      throw new UnauthorizedException('管理员不存在');
    }

    if (admin.status !== 1) {
      throw new BadRequestException('账户已禁用');
    }

    const passwordValid = await bcrypt.compare(password, admin.password);
    if (!passwordValid) {
      throw new UnauthorizedException('密码错误');
    }

    // 生成Token
    const token = this.authService.generateAdminToken(admin.adminId);

    // 更新最后登录时间
    admin.lastLoginTime = new Date();
    await this.adminRepository.save(admin);

    return {
      adminId: admin.adminId,
      username: admin.username,
      role: admin.role,
      token,
    };
  }

  /**
   * 获取统计数据
   */
  async getDashboardStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 今日活跃用户
    const todayActiveUsers = await this.userRepository.count({
      where: {
        lastLoginTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    // 今日新增用户
    const todayNewUsers = await this.userRepository.count({
      where: {
        registerTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    // 昨日新增用户（用于计算增长率）
    const yesterdayNewUsers = await this.userRepository.count({
      where: {
        registerTime: yesterday,
      },
    });

    // 今日留言量
    const todayMessages = await this.messageRepository.count({
      where: {
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    // 昨日留言量
    const yesterdayMessages = await this.messageRepository.count({
      where: {
        createdAt: yesterday,
      },
    });

    // 待处理举报
    const pendingReports = await this.reportRepository.count({
      where: { status: 0 },
    });

    // 账户状态分布
    const normalUsers = await this.userRepository.count({ where: { status: 1 } });
    const frozenUsers = await this.userRepository.count({ where: { status: 2 } });
    const bannedUsers = await this.userRepository.count({ where: { status: 3 } });

    // 7日趋势数据
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const usersCount = await this.userRepository.count({
        where: {
          registerTime: date,
        },
      });

      const messagesCount = await this.messageRepository.count({
        where: {
          createdAt: date,
        },
      });

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        users: usersCount,
        messages: messagesCount,
      });
    }

    return {
      todayActiveUsers,
      todayNewUsers,
      yesterdayNewUsers,
      todayMessages,
      yesterdayMessages,
      pendingReports,
      accountStatus: {
        normal: normalUsers,
        frozen: frozenUsers,
        banned: bannedUsers,
      },
      dailyStats,
    };
  }

  /**
   * 获取用户列表
   */
  async getUsers(query: {
    page: number;
    size: number;
    status?: number;
    keyword?: string;
  }): Promise<any> {
    const { page, size, status, keyword } = query;
    const skip = (page - 1) * size;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (status !== undefined) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(user.userId LIKE :keyword OR user.nickname LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      users: users.map(user => ({
        userId: user.userId,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        status: user.status,
        reportCount: user.reportCount,
        freezeCount: user.freezeCount,
        registerTime: user.registerTime,
        lastLoginTime: user.lastLoginTime,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取用户详情
   */
  async getUserDetail(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 获取用户发送的留言数量
    const sentCount = await this.messageRepository.count({
      where: { senderId: userId },
    });

    // 获取用户被举报次数
    const reportCount = await this.reportRepository.count({
      where: { reportedUserId: userId },
    });

    return {
      userId: user.userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      status: user.status,
      reportCount: user.reportCount,
      freezeCount: user.freezeCount,
      freezeUntil: user.freezeUntil,
      registerTime: user.registerTime,
      lastLoginTime: user.lastLoginTime,
      ipAddress: user.ipAddress,
      currentCoordId: user.currentCoordId,
      sentCount,
      reportedCount: reportCount,
    };
  }

  /**
   * 获取留言列表
   */
  async getMessages(query: {
    page: number;
    size: number;
    status?: number;
    contentType?: number;
    keyword?: string;
  }): Promise<any> {
    const { page, size, status, contentType, keyword } = query;
    const skip = (page - 1) * size;

    const queryBuilder = this.messageRepository.createQueryBuilder('msg');

    if (status !== undefined) {
      queryBuilder.andWhere('msg.status = :status', { status });
    }

    if (contentType !== undefined) {
      queryBuilder.andWhere('msg.contentType = :contentType', { contentType });
    }

    if (keyword) {
      queryBuilder.andWhere('msg.content LIKE :keyword', { keyword: `%${keyword}%` });
    }

    const [messages, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('msg.createdAt', 'DESC')
      .getManyAndCount();

    return {
      messages: messages.map(msg => ({
        msgId: msg.msgId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        coordId: msg.coordId,
        contentType: msg.contentType,
        content: msg.content,
        mediaUrls: msg.mediaUrls,
        isAnonymous: msg.isAnonymous,
        status: msg.status,
        createdAt: msg.createdAt,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取举报列表
   */
  async getReports(query: {
    page: number;
    size: number;
    status?: number;
    keyword?: string;
  }): Promise<any> {
    const { page, size, status, keyword } = query;
    const skip = (page - 1) * size;

    const queryBuilder = this.reportRepository.createQueryBuilder('report');

    if (status !== undefined) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(report.reportedUserId LIKE :keyword OR report.reason LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [reports, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('report.createdAt', 'DESC')
      .getManyAndCount();

    return {
      reports: reports.map(report => ({
        reportId: report.reportId,
        reporterId: report.reporterId,
        reportedUserId: report.reportedUserId,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        status: report.status,
        handleResult: report.handleResult,
        createdAt: report.createdAt,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 处理举报
   */
  async handleReport(reportId: string, result: string): Promise<void> {
    const report = await this.reportRepository.findOne({ where: { reportId } });
    if (!report) {
      throw new BadRequestException('举报不存在');
    }

    report.status = 1; // 已处理
    report.handleResult = result;
    report.handledAt = new Date();

    await this.reportRepository.save(report);
  }
}
