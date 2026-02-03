import { Module } from '@nestjs/common';
import { DeliveryRequestsService } from './delivery-requests.service';
import { DeliveryRequestsController } from './controllers/delivery-requests.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DeliveryRequestsService],
  controllers: [DeliveryRequestsController]
})
export class DeliveryRequestsModule {}
