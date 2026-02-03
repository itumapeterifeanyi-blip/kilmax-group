import { IsUUID, IsString, IsOptional, IsInt, Min, IsNumber, IsPositive, IsDateString } from 'class-validator';

export class CreateDeliveryRequestDto {
  @IsUUID()
  customer_id: string;

  @IsUUID()
  @IsOptional()
  branch_id?: string;

  @IsUUID()
  @IsOptional()
  zone_id?: string;

  @IsUUID()
  @IsOptional()
  price_id?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  address: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  contact_name?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsDateString()
  delivery_window_start?: string;

  @IsOptional()
  @IsDateString()
  delivery_window_end?: string;

  @IsOptional()
  @IsDateString()
  cut_off_time?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsNumber()
  @IsPositive()
  gross_amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  tax_amount?: number;

  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @IsNumber()
  @IsPositive()
  total_amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
