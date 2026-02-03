import { Controller, Get, Param, Patch, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { DriverOperationsService } from './driver-operations.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { BatchStopStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class UpdateStopStatusDto {
    @IsEnum(BatchStopStatus)
    status: BatchStopStatus;

    @IsOptional()
    @IsString()
    failure_reason?: string;
}

@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverOperationsController {
    constructor(private readonly service: DriverOperationsService) { }

    @Get('active-batch')
    @Roles('driver.view')
    async getActiveBatch(@Req() req: any) {
        const driverId = req.user.userId; // Assuming ID is mapped from JWT
        // In a real app, we'd verify the user is actually a driver role from the token
        return this.service.getActiveAssignment(driverId);
    }

    @Patch('stops/:id/status')
    @Roles('batch_stop.update.status')
    async updateStopStatus(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateStopStatusDto
    ) {
        const driverId = req.user.userId;
        return this.service.updateStopStatus(driverId, id, dto.status, dto.failure_reason);
    }
}
