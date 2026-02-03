import { Controller, Post, UseGuards, Req, Get } from '@nestjs/common';
import { BatchAssignmentService } from './batch-assignment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('batch-assignment')
export class BatchAssignmentController {
  constructor(private service: BatchAssignmentService) {}

  @Post('run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('delivery_batch.assign')
  async run(@Req() req: any) {
    const actor = { userId: req.user?.userId, role: req.user?.role };
    return this.service.run(actor);
  }

  @Get('driver/batches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('delivery_batch.view.assigned')
  async myBatches(@Req() req: any) {
    const driverId = req.user?.userId;
    return this.service.getBatchesForDriver(driverId);
  }
}
