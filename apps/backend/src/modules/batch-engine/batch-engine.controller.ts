import { Controller, Post, UseGuards } from '@nestjs/common';
import { BatchEngineService } from './batch-engine.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('batch-engine')
export class BatchEngineController {
  constructor(private readonly service: BatchEngineService) {}

  @Post('run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('delivery_batch.create')
  async run() {
    return this.service.run(new Date());
  }
}
