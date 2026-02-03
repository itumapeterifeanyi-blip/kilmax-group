import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterAdminDto } from './dtos/register-admin.dto';
import { LoginDto } from './dtos/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async registerAdmin(dto: RegisterAdminDto) {
    const existing = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 12);
    const created = await this.prisma.adminUser.create({
      data: {
        full_name: dto.full_name,
        email: dto.email,
        password_hash: hash,
        role: dto.role as any
      }
    });
    return { id: created.id, email: created.email, role: created.role };
  }

  async loginAdmin(dto: LoginDto) {
    const user = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }

  // Customers
  async registerCustomer(dto: any) {
    const existing = await this.prisma.customer.findFirst({ where: { OR: [{ email: dto.email || undefined }, { phone: dto.phone }] } });
    if (existing) throw new BadRequestException('Customer already exists');
    const hash = await bcrypt.hash(dto.password, 12);
    const created = await this.prisma.customer.create({
      data: {
        full_name: dto.full_name,
        phone: dto.phone,
        email: dto.email ?? null,
        password_hash: hash
      }
    });
    return { id: created.id, phone: created.phone, email: created.email };
  }

  async loginCustomer(dto: LoginDto) {
    const user = await this.prisma.customer.findFirst({ where: { OR: [{ email: dto.email }, { phone: dto.email }] } });
    if (!user || !user.password_hash) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, role: 'customer' };
    const token = this.jwtService.sign(payload);
    await this.prisma.customer.update({ where: { id: user.id }, data: { last_login: new Date() } });
    return { access_token: token };
  }

  // Drivers
  async registerDriver(dto: any) {
    const existing = await this.prisma.driver.findFirst({ where: { OR: [{ email: dto.email || undefined }, { phone: dto.phone }] } });
    if (existing) throw new BadRequestException('Driver already exists');
    const hash = await bcrypt.hash(dto.password, 12);
    const created = await this.prisma.driver.create({
      data: {
        full_name: dto.full_name,
        phone: dto.phone,
        email: dto.email ?? null,
        license_number: dto.license_number ?? null,
        password_hash: hash
      }
    });
    return { id: created.id, phone: created.phone, email: created.email };
  }

  async loginDriver(dto: LoginDto) {
    const user = await this.prisma.driver.findFirst({ where: { OR: [{ email: dto.email }, { phone: dto.email }] } });
    if (!user || !user.password_hash) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, role: 'driver' };
    const token = this.jwtService.sign(payload);
    await this.prisma.driver.update({ where: { id: user.id }, data: { last_login: new Date() } });
    return { access_token: token };
  }
}
