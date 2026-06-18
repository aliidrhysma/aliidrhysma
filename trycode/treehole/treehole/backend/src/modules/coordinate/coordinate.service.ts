import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coordinate } from './coordinate.entity';
import { redisClient, REDIS_KEYS } from '../../database/redis';

@Injectable()
export class CoordinateService {
  constructor(
    @InjectRepository(Coordinate)
    private coordinateRepository: Repository<Coordinate>,
  ) {}

  /**
   * 分配坐标给用户
   * 优先分配高热度坐标
   */
  async assignCoordinate(userId: string): Promise<Coordinate | null> {
    // 使用分布式锁
    const lockKey = `${REDIS_KEYS.COORD_LOCK}:assign`;
    const lockValue = Date.now().toString();
    
    // 尝试获取锁（3秒超时）
    const lockAcquired = await redisClient.set(lockKey, lockValue, 'EX', 3, 'NX');
    if (!lockAcquired) {
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      // 1. 优先从高热度池中随机选择
      const hotCoords = await this.coordinateRepository
        .createQueryBuilder('coord')
        .where('coord.status = :status', { status: 0 })
        .orderBy('coord.heatScore', 'DESC')
        .take(1000)
        .getMany();

      if (hotCoords.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(hotCoords.length, 100));
        const selectedCoord = hotCoords[randomIndex];
        
        selectedCoord.userId = userId;
        selectedCoord.status = 1;
        selectedCoord.occupiedAt = new Date();
        await this.coordinateRepository.save(selectedCoord);
        
        return selectedCoord;
      }

      // 2. 从空闲池中随机选择
      const freeCoord = await this.coordinateRepository
        .createQueryBuilder('coord')
        .where('coord.status = :status', { status: 0 })
        .orderBy('RAND()')
        .take(1)
        .getOne();

      if (freeCoord) {
        freeCoord.userId = userId;
        freeCoord.status = 1;
        freeCoord.occupiedAt = new Date();
        await this.coordinateRepository.save(freeCoord);
        
        return freeCoord;
      }

      return null; // 没有可用坐标
    } finally {
      // 释放锁
      const currentLock = await redisClient.get(lockKey);
      if (currentLock === lockValue) {
        await redisClient.del(lockKey);
      }
    }
  }

  /**
   * 释放坐标
   */
  async releaseCoordinate(coordId: string): Promise<void> {
    await this.coordinateRepository.update(
      { coordId },
      { userId: null, status: 0, occupiedAt: null },
    );
  }

  /**
   * 刷新坐标（每日登录）
   * 如果当前坐标热度较低，重新分配一个
   */
  async refreshCoordinate(userId: string, currentCoordId?: string): Promise<Coordinate | null> {
    if (!currentCoordId) {
      return this.assignCoordinate(userId);
    }

    // 检查当前坐标热度
    const currentCoord = await this.coordinateRepository.findOne({
      where: { coordId: currentCoordId },
    });

    if (currentCoord && currentCoord.heatScore < 50) {
      // 热度低，释放并重新分配
      await this.releaseCoordinate(currentCoordId);
      return this.assignCoordinate(userId);
    }

    return currentCoord;
  }

  /**
   * 增加坐标热度
   */
  async increaseHeat(coordId: string, score: number = 1): Promise<void> {
    await this.coordinateRepository
      .createQueryBuilder()
      .update(Coordinate)
      .set({ heatScore: () => `heat_score + ${score}` })
      .where('coordId = :coordId', { coordId })
      .execute();
  }

  /**
   * 获取坐标信息
   */
  async getCoordinateInfo(userId: string): Promise<any> {
    const coord = await this.coordinateRepository.findOne({
      where: { userId },
    });

    if (!coord) {
      // 自动分配
      const newCoord = await this.assignCoordinate(userId);
      return newCoord;
    }

    // 计算入驻天数
    const days = Math.floor((Date.now() - new Date(coord.occupiedAt).getTime()) / 86400000);

    return {
      coordId: coord.coordId,
      heatScore: coord.heatScore,
      occupiedDays: days,
    };
  }

  /**
   * 获取空闲坐标数量
   */
  async getAvailableCount(): Promise<number> {
    return this.coordinateRepository.count({
      where: { status: 0 },
    });
  }
}
