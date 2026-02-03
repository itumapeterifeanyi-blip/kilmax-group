import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import IORedis from 'ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class LockService implements OnModuleDestroy {
  private readonly logger = new Logger(LockService.name);
  private redis: IORedis.Redis;
  private tokens = new Map<string, string>();

  constructor() {
    this.redis = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
    });
  }

  async acquire(key: string, ttlMs = 30_000): Promise<string | null> {
    const token = randomUUID();
    const ok = await this.redis.set(key, token, 'PX', ttlMs, 'NX');
    if (ok === 'OK') {
      this.tokens.set(key, token);
      return token;
    }
    return null;
  }

  async release(key: string, token?: string) {
    // safer release: compare token
    const releaseScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const t = token || this.tokens.get(key) || '';
    try {
      await this.redis.eval(releaseScript, 1, key, t);
      this.tokens.delete(key);
    } catch (err) {
      this.logger.error('Error releasing lock', err as any);
    }
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
    } catch (err) {
      this.logger.error('Error closing redis', err as any);
    }
  }
}
