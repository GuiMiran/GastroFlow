/**
 * M0-PLATFORM — Roles decorator
 * Decorador para marcar qué roles tienen acceso a un endpoint.
 */
import { SetMetadata } from '@nestjs/common';
import { RolEmpleado } from './auth.types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolEmpleado[]) => SetMetadata(ROLES_KEY, roles);
