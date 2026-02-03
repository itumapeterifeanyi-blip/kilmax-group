import { Module } from '@nestjs/common';
import { BatchAssignmentService } from './batch-assignment.service';
import { BatchAssignmentController } from './batch-assignment.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueModule } from '../../queue/queue.module';
import { NotificationService } from '../../notifications/notification.service';

@Module({
  imports: [PrismaModule, QueueModule],
  providers: [BatchAssignmentService, NotificationService],
  controllers: [BatchAssignmentController],
  exports: [BatchAssignmentService]
})
export class BatchAssignmentModule {}
