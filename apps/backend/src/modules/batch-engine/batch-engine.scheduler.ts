import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { QueueService } from '../../queue/queue.service';

@Injectable()
export class BatchEngineScheduler {
  private readonly logger = new Logger(BatchEngineScheduler.name);

  constructor(private queue: QueueService, private scheduler: SchedulerRegistry) {}

  // default: run every 5 minutes; configurable via env if needed
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.log('Cron: enqueueing batch-engine run');
    await this.queue.addBatchRunJob({ triggeredBy: 'cron' });
  }
}
