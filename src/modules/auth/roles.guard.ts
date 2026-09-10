/**
 * M0-PLATFORM — RolesGuard
 * Verifica que el usuario logueado tenga uno de los roles permitidos.
 * Debe usarse junto con @JwtAuthGuard (o como guard global).
 */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';
import { JwtPayload, RolEmpleado } from './auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolEmpleado[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin @Roles() → acceso libre (solo JWT requerido)
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: JwtPayload }).user;

    if (!user) {
      throw new ForbiddenException('Sin sesión activa');
    }
    if (!requiredRoles.includes(user.rol)) {
      throw new ForbiddenException(
        `Acceso denegado — se requiere rol: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
