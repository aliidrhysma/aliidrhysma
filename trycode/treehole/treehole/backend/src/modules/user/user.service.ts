import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { MessageService } from '../message/message.service';
import { ReplyService } from '../reply/reply.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private messageService: MessageService,
    private replyService: ReplyService,
  ) {}

  async findByUserId(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { userId } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createUser(data: {
    userId: string;
    nickname: string;
    password: string;
    ipAddress?: string;
  }): Promise<User> {
    const existingUser = await this.findByUserId(data.userId);
    if (existingUser) {
      throw new BadRequestException('用户ID已存在');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepository.create({
      userId: data.userId,
      nickname: data.nickname,
      password: hashedPassword,
      ipAddress: data.ipAddress,
      registerTime: new Date(),
      status: 1,
    });

    return this.userRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password) {
      return false;
    }
    return bcrypt.compare(password, user.password);
  }

  async updateLastLoginTime(userId: string): Promise<void> {
    await this.userRepository.update({ userId }, { lastLoginTime: new Date() });
  }

  async updateUserInfo(
    userId: string,
    data: { nickname?: string; avatarUrl?: string },
  ): Promise<User> {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (data.nickname) {
      user.nickname = data.nickname;
    }
    if (data.avatarUrl) {
      user.avatarUrl = data.avatarUrl;
    }

    return this.userRepository.save(user);
  }

  async getUserInfo(userId: string): Promise<Partial<User>> {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      userId: user.userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      status: user.status,
      registerTime: user.registerTime,
      lastLoginTime: user.lastLoginTime,
    };
  }

  async isUserFrozen(userId: string): Promise<boolean> {
    const user = await this.findByUserId(userId);
    if (!user) {
      return false;
    }

    if (user.status === 2 && user.freezeUntil) {
      if (new Date() < user.freezeUntil) {
        return true;
      }
    }

    return user.status === 3; // 封禁状态
  }

  /**
   * 获取个人主页数据
   */
  async getUserHome(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const sentMessages = await this.messageService.getUserSentMessages(userId);
    const receivedReplies = await this.replyService.getUserReplies(userId);

    return {
      userInfo: {
        userId: user.userId,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        coordId: user.currentCoordId,
        registerTime: user.registerTime,
      },
      sentCount: sentMessages.length,
      sentMessages: sentMessages.slice(0, 10), // 只返回前10条
      repliedCount: receivedReplies.length,
      receivedReplies: receivedReplies.slice(0, 10),
    };
  }
}
