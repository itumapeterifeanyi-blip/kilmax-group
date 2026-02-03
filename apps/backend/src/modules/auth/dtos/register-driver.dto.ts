import { IsString, IsEmail, IsOptional } from 'class-validator';

export class RegisterDriverDto {
  @IsString()
  full_name: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  license_number?: string;
}
