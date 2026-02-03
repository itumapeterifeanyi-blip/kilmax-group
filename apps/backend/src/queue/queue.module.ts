import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { LockService } from './lock.service';

@Global()
@Module({
  providers: [QueueService, LockService],
  exports: [QueueService, LockService]
})
export class QueueModule {}
