import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DeliveryRequestsModule } from './modules/delivery-requests/delivery-requests.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BatchEngineModule } from './modules/batch-engine/batch-engine.module';
import { QueueModule } from './queue/queue.module';
import { BatchAssignmentModule } from './modules/batch-assignment/batch-assignment.module';
import { DriverOperationsModule } from './modules/driver-operations/driver-operations.module';
import { FinanceModule } from './modules/finance/finance.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DeliveryRequestsModule,
    BatchEngineModule,
    QueueModule,
    BatchAssignmentModule,
    DriverOperationsModule,
    FinanceModule
  ],
  controllers: [],
  providers: []
})
export class AppModule { }
