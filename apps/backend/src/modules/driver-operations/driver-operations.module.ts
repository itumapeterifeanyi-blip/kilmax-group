import { Module } from '@nestjs/common';
import { DriverOperationsController } from './driver-operations.controller';
import { DriverOperationsService } from './driver-operations.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DriverOperationsController],
    providers: [DriverOperationsService],
    exports: [DriverOperationsService],
})
export class DriverOperationsModule { }
