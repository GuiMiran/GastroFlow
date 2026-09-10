import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../../common/prisma/prisma.service';

@ApiTags('Setup')

/**
 * Endpoint de autoconfiguración para la página Setup del frontend.
 * Devuelve los datos del primer establecimiento con sus empleados y caja,
 * para que el usuario no tenga que copiar UUIDs manualmente.
 */
@Controller('setup')
export class SetupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('info')
  @ApiOperation({
    summary: 'Datos iniciales del establecimiento para la pantalla Setup',
    description:
      'Devuelve el primer establecimiento activo con su ID, empleados y caja principal. ' +
      'Eliminat la necesidad de copiar UUIDs manualmente durante el onboarding. ' +
      'No requiere autenticación (solo para entorno de configuración inicial).',
  })
  @ApiOkResponse({
    description: 'Datos del establecimiento, empleados activos y caja principal',
    schema: {
      type: 'object',
      properties: {
        establecimiento: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string', example: 'Mi Restaurante' },
          },
        },
        empleados: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              nombre: { type: 'string' },
              puesto: { type: 'string' },
            },
          },
        },
        caja: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string', example: 'Caja Principal' },
          },
        },
      },
    },
  })
  async info() {
    const estab = await this.prisma.establecimiento.findFirst({
      select: {
        id: true,
        nombre: true,
        empleados: {
          where: { activo: true },
          select: { id: true, nombre: true, puesto: true },
          orderBy: { nombre: 'asc' },
        },
        cajas: {
          where: { activa: true },
          select: { id: true, nombre: true },
          take: 1,
        },
      },
    });

    if (!estab) return { establecimiento: null, empleados: [], caja: null };

    return {
      establecimiento: { id: estab.id, nombre: estab.nombre },
      empleados: estab.empleados,
      caja: estab.cajas[0] ?? null,
    };
  }
}
