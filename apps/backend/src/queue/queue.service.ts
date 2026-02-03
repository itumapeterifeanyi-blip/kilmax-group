import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, QueueOptions } from 'bullmq';

const DEFAULT_QUEUE_NAME = 'batch-engine-queue';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queue: Queue;

  constructor() {
    const connection: QueueOptions['connection'] = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379)
    } as any;

    this.queue = new Queue(DEFAULT_QUEUE_NAME, { connection } as QueueOptions);
  }

  async addBatchRunJob(payload: any = {}) {
    this.logger.log('Enqueuing batch-engine.run job');
    return this.queue.add('run', payload, { removeOnComplete: true, removeOnFail: false });
  }

  async onModuleDestroy() {
    try {
      await this.queue.close();
    } catch (err) {
      this.logger.error('Error closing queue', err as any);
    }
  }
}
