import { IsEmail, IsString, IsEnum } from 'class-validator';
import { UserRole } from '../../../prisma/schema.prisma';

export class RegisterAdminDto {
  @IsString()
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(['staff','manager','owner'])
  role: 'staff' | 'manager' | 'owner';
}
