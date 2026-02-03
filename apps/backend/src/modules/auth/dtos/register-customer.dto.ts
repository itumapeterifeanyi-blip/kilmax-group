import { IsString, IsEmail, IsOptional } from 'class-validator';

export class RegisterCustomerDto {
  @IsString()
  full_name: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  password: string;
}
