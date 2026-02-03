import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './roles.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RolesGuard implements CanActivate {
  private roleMap: Record<string, string[]> = {};

  constructor(private reflector: Reflector) {
    // load role_permissions.json (runtime)
    try {
      const base = process.cwd();
      const jsonPath = path.join(base, 'apps', 'backend', 'auth', 'role_permissions.json');
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const parsed = JSON.parse(raw);
      this.roleMap = parsed.roles || {};
    } catch (e) {
      // if not found, keep empty; admin can load later
      this.roleMap = {};
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<string>(PERMISSION_KEY, context.getHandler());
    if (!permission) return true; // no permission required

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || !user.role) throw new ForbiddenException('No role present');

    const allowed = this.roleMap[user.role] || [];
    if (!allowed.includes(permission)) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
