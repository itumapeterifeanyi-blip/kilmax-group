import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [FinanceService],
    exports: [FinanceService],
})
export class FinanceModule { }
