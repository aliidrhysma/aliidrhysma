import Redis from 'ioredis';
import { redisConfig } from '../config/redis.config';

export const redisClient = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
  retryStrategy: redisConfig.retryStrategy,
  maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
});

redisClient.on('connect', () => {
  console.log('Redis 连接成功');
});

redisClient.on('error', (err) => {
  console.error('Redis 连接失败:', err);
});

redisClient.on('close', () => {
  console.log('Redis 连接已关闭');
});

// Redis Key 前缀约定
export const REDIS_KEYS = {
  USER_TOKEN: 'token:user:',           // 用户Token
  USER_STATUS: 'user:status:',         // 用户状态
  COORD_LOCK: 'coord:lock:',           // 坐标分布式锁
  DAILY_SEND_LIMIT: 'limit:send:',    // 每日发送限制
  DAILY_RECV_LIMIT: 'limit:recv:',    // 每日接收限制
  IP_REG_COUNT: 'ip:reg:',             // IP注册计数
  LOGIN_FAIL: 'login:fail:',          // 登录失败计数
  SENSITIVE_WORDS: 'sensitive:words',  // 敏感词集合
};

// Token 过期时间（秒）
export const TOKEN_EXPIRE = 7 * 24 * 60 * 60; // 7天

// Redis 操作辅助函数
export const redisHelper = {
  // 设置带过期时间的键值
  async setex(key: string, seconds: number, value: string): Promise<void> {
    await redisClient.setex(key, seconds, value);
  },

  // 获取值
  async get(key: string): Promise<string | null> {
    return redisClient.get(key);
  },

  // 删除键
  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },

  // 自增
  async incr(key: string): Promise<number> {
    return redisClient.incr(key);
  },

  // 设置过期时间
  async expire(key: string, seconds: number): Promise<void> {
    await redisClient.expire(key, seconds);
  },

  // 检查键是否存在
  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  },

  // 分布式锁
  async setLock(key: string, value: string, expireSeconds: number): Promise<boolean> {
    const result = await redisClient.set(key, value, 'EX', expireSeconds, 'NX');
    return result === 'OK';
  },

  // 释放分布式锁
  async releaseLock(key: string, value: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await redisClient.eval(script, 1, key, value);
    return result === 1;
  },
};
