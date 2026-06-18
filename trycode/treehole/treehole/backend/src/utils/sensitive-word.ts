import { Injectable } from '@nestjs/common';
import { redisClient, REDIS_KEYS } from '../database/redis';

@Injectable()
export class SensitiveWordService {
  /**
   * 初始化敏感词库
   */
  async initializeSensitiveWords(): Promise<void> {
    const words = [
      // 政治敏感词（示例）
      '敏感词示例1',
      '敏感词示例2',
      // 色情敏感词（示例）
      '敏感词示例3',
      '敏感词示例4',
      // 暴力敏感词（示例）
      '敏感词示例5',
      '敏感词示例6',
    ];

    // 存储到Redis Set
    await redisClient.del(REDIS_KEYS.SENSITIVE_WORDS);
    for (const word of words) {
      await redisClient.sadd(REDIS_KEYS.SENSITIVE_WORDS, word);
    }
  }

  /**
   * 添加敏感词
   */
  async addWord(word: string): Promise<void> {
    await redisClient.sadd(REDIS_KEYS.SENSITIVE_WORDS, word);
  }

  /**
   * 删除敏感词
   */
  async removeWord(word: string): Promise<void> {
    await redisClient.srem(REDIS_KEYS.SENSITIVE_WORDS, word);
  }

  /**
   * 获取所有敏感词
   */
  async getAllWords(): Promise<string[]> {
    return await redisClient.smembers(REDIS_KEYS.SENSITIVE_WORDS);
  }

  /**
   * 检查文本是否包含敏感词
   */
  async checkText(text: string): Promise<boolean> {
    const words = await this.getAllWords();
    for (const word of words) {
      if (text.includes(word)) {
        return true;
      }
    }
    return false;
  }
}
