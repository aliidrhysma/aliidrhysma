import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserStatus } from '../user/user.entity';
import { Admin } from '../admin/admin.entity';
import { redisClient, REDIS_KEYS, TOKEN_EXPIRE } from '../../database/redis';
import { IdGenerator } from '../../utils/id-generator';
import { CoordinateService } from '../coordinate/coordinate.service';
import { RegisterDto, LoginDto } from '../../common/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private coordinateService: CoordinateService,
    private dataSource: DataSource,
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto, ipAddress: string): Promise<any> {
    const { nickname, avatarUrl } = registerDto;

    // 1. 检查IP注册限制（每天最多3个）
    const today = new Date().toISOString().split('T')[0];
    const ipRegCount = await redisClient.get(`${REDIS_KEYS.IP_REG_COUNT}:${ipAddress}:${today}`);
    if (ipRegCount && parseInt(ipRegCount) >= 3) {
      throw new BadRequestException('该IP今日注册次数已达上限，请明天再试');
    }

    // 2. 生成用户ID
    const userId = IdGenerator.generateUserId();

    // 3. 分配坐标
    const coord = await this.coordinateService.assignCoordinate(userId);
    if (!coord) {
      throw new BadRequestException('系统繁忙，暂无空闲位置，请稍后再试');
    }

    // 4. 创建用户（事务）
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建用户记录
      const user = queryRunner.manager.create(User, {
        userId,
        nickname,
        avatarUrl,
        ipAddress,
        currentCoordId: coord.coordId,
        registerTime: new Date(),
      });
      await queryRunner.manager.save(user);

      // 记录IP注册
      await queryRunner.query(
        'INSERT INTO ip_registrations (ip_address, user_id, register_date) VALUES (?, ?, ?)',
        [ipAddress, userId, today],
      );

      await queryRunner.commitTransaction();

      // 增加IP注册计数
      await redisClient.incr(`${REDIS_KEYS.IP_REG_COUNT}:${ipAddress}:${today}`);
      await redisClient.expire(`${REDIS_KEYS.IP_REG_COUNT}:${ipAddress}:${today}`, 86400);

      // 5. 生成Token
      const token = await this.generateToken(userId);

      return {
        userId,
        nickname,
        avatarUrl,
        coordId: coord.coordId,
        token,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // 释放坐标
      await this.coordinateService.releaseCoordinate(coord.coordId);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto, ipAddress: string): Promise<any> {
    const { userId } = loginDto;

    // 1. 检查登录失败锁定
    const lockedUntil = await redisClient.get(`${REDIS_KEYS.LOGIN_FAIL}:${ipAddress}`);
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      const remainMinutes = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000);
      throw new BadRequestException(`登录失败次数过多，请${remainMinutes}分钟后再试`);
    }

    // 2. 查找用户
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      // 记录登录失败
      await this.recordLoginFailure(ipAddress);
      throw new UnauthorizedException('用户不存在');
    }

    // 3. 检查账户状态
    if (user.status === UserStatus.FROZEN) {
      if (user.freezeUntil && new Date(user.freezeUntil) > new Date()) {
        const remainDays = Math.ceil((new Date(user.freezeUntil).getTime() - Date.now()) / 86400000);
        throw new BadRequestException(`账户已被冻结，剩余${remainDays}天解封`);
      } else {
        // 解冻
        user.status = UserStatus.NORMAL;
        user.freezeUntil = null;
        await this.userRepository.save(user);
      }
    }

    if (user.status === UserStatus.BANNED) {
      throw new BadRequestException('账户已被封禁');
    }

    // 4. 更新登录信息
    user.lastLoginTime = new Date();
    user.ipAddress = ipAddress;
    await this.userRepository.save(user);

    // 5. 清除登录失败记录
    await redisClient.del(`${REDIS_KEYS.LOGIN_FAIL}:${ipAddress}`);

    // 6. 重新分配坐标（每日刷新）
    const newCoord = await this.coordinateService.refreshCoordinate(userId, user.currentCoordId);

    // 7. 生成Token
    const token = await this.generateToken(userId);

    return {
      userId: user.userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      coordId: newCoord?.coordId || user.currentCoordId,
      status: user.status,
      token,
    };
  }

  /**
   * 生成JWT Token
   */
  private async generateToken(userId: string): Promise<string> {
    const payload = { sub: userId, type: 'user' };
    const token = this.jwtService.sign(payload);

    // 存储到Redis
    await redisClient.setex(
      `${REDIS_KEYS.USER_TOKEN}:${userId}`,
      TOKEN_EXPIRE,
      token,
    );

    return token;
  }

  /**
   * 记录登录失败
   */
  private async recordLoginFailure(ipAddress: string): Promise<void> {
    const key = `${REDIS_KEYS.LOGIN_FAIL}:${ipAddress}`;
    const count = await redisClient.incr(key);
    
    if (count === 1) {
      await redisClient.expire(key, 1800); // 30分钟内过期
    }

    // 5次失败后锁定30分钟
    if (count >= 5) {
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await redisClient.set(key, lockedUntil);
    }
  }

  /**
   * 验证Token
   */
  async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      const cachedToken = await redisClient.get(`${REDIS_KEYS.USER_TOKEN}:${payload.sub}`);
      
      if (cachedToken !== token) {
        return null;
      }

      const user = await this.userRepository.findOne({
        where: { userId: payload.sub },
        select: ['userId', 'nickname', 'avatarUrl', 'status', 'currentCoordId'],
      });

      return user;
    } catch {
      return null;
    }
  }

  /**
   * 退出登录
   */
  async logout(userId: string): Promise<void> {
    await redisClient.del(`${REDIS_KEYS.USER_TOKEN}:${userId}`);
  }

  /**
   * 获取当前用户信息
   */
  async getUserInfo(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    return {
      userId: user.userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      coordId: user.currentCoordId,
      status: user.status,
      registerTime: user.registerTime,
      lastLoginTime: user.lastLoginTime,
    };
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userId: string, data: { nickname?: string; avatarUrl?: string }): Promise<any> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    if (data.nickname) {
      user.nickname = data.nickname;
    }
    if (data.avatarUrl) {
      user.avatarUrl = data.avatarUrl;
    }

    await this.userRepository.save(user);

    return {
      userId: user.userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * 生成管理员JWT Token
   */
  async generateAdminToken(adminId: string): Promise<string> {
    const payload = { sub: adminId, type: 'admin' };
    const token = this.jwtService.sign(payload);
    return token;
  }

  /**
   * 验证管理员Token
   */
  async validateAdminToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'admin') {
        return null;
      }

      const admin = await this.adminRepository.findOne({
        where: { adminId: payload.sub },
        select: ['adminId', 'username', 'role', 'status'],
      });

      if (!admin || admin.status !== 1) {
        return null;
      }

      return admin;
    } catch {
      return null;
    }
  }
}
