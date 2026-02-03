import { Module } from '@nestjs/common';
import { BatchEngineService } from './batch-engine.service';
import { BatchEngineController } from './batch-engine.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BatchEngineScheduler } from './batch-engine.scheduler';
import { QueueModule } from '../../queue/queue.module';

@Module({
  imports: [PrismaModule, QueueModule],
  providers: [BatchEngineService, BatchEngineScheduler],
  controllers: [BatchEngineController],
  exports: [BatchEngineService]
})
export class BatchEngineModule {}
