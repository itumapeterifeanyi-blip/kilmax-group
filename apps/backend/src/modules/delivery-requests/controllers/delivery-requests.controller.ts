import { Body, Controller, Post, UsePipes, ValidationPipe, UseGuards, Req } from '@nestjs/common';
import { DeliveryRequestsService } from '../delivery-requests.service';
import { CreateDeliveryRequestDto } from '../dtos/create-delivery-request.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('delivery-requests')
export class DeliveryRequestsController {
  constructor(private readonly service: DeliveryRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('delivery_request.create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Req() req: any, @Body() dto: CreateDeliveryRequestDto) {
    // enforce customer ownership: if JWT subject present and role is customer, use that id
    const user = req.user || null;
    if (user && user.userId && user.role === 'customer') {
      dto.customer_id = user.userId;
    }

    const created = await this.service.create(dto);
    return created;
  }
}
