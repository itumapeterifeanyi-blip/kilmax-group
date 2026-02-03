import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { jwtConstants } from './constants';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
    }),
  ],
  providers: [JwtStrategy, AuthService, RolesGuard, Reflector],
  controllers: [AuthController],
  exports: [JwtModule, PassportModule, AuthService, RolesGuard],
})
export class AuthModule {}
