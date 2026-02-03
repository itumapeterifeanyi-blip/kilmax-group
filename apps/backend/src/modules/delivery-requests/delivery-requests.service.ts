import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeliveryRequestDto } from './dtos/create-delivery-request.dto';

@Injectable()
export class DeliveryRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDeliveryRequestDto) {
    const payload: any = {
      customer_id: data.customer_id,
      branch_id: data.branch_id ?? null,
      zone_id: data.zone_id ?? null,
      price_id: data.price_id ?? null,
      quantity: data.quantity,
      address: data.address,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      contact_name: data.contact_name ?? null,
      contact_phone: data.contact_phone ?? null,
      delivery_window_start: data.delivery_window_start ?? null,
      delivery_window_end: data.delivery_window_end ?? null,
      cut_off_time: data.cut_off_time ?? null,
      requested_at: new Date(),
      status: undefined, // let DB default to 'pending'
      payment_method: data.payment_method ?? null,
      gross_amount: data.gross_amount,
      currency: data.currency ?? 'NGN',
      tax_amount: data.tax_amount ?? 0,
      discount_amount: data.discount_amount ?? 0,
      total_amount: data.total_amount,
      notes: data.notes ?? null
    };

    const created = await this.prisma.deliveryRequest.create({ data: payload });
    return created;
  }
}
