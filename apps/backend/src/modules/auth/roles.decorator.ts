import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const Roles = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
