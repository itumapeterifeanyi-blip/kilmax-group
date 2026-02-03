import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAdminDto } from './dtos/register-admin.dto';
import { LoginDto } from './dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('admin/register')
  async registerAdmin(@Body() dto: RegisterAdminDto) {
    return this.service.registerAdmin(dto);
  }

  @Post('admin/login')
  async loginAdmin(@Body() dto: LoginDto) {
    return this.service.loginAdmin(dto);
  }

  @Post('customer/register')
  async registerCustomer(@Body() dto: any) {
    return this.service.registerCustomer(dto);
  }

  @Post('customer/login')
  async loginCustomer(@Body() dto: LoginDto) {
    return this.service.loginCustomer(dto);
  }

  @Post('driver/register')
  async registerDriver(@Body() dto: any) {
    return this.service.registerDriver(dto);
  }

  @Post('driver/login')
  async loginDriver(@Body() dto: LoginDto) {
    return this.service.loginDriver(dto);
  }
}
