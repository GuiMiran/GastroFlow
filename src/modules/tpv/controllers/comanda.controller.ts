import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComandaService } from '../services/comanda.service';

@ApiTags('Comandas')
@ApiBearerAuth('JWT')
@Controller('comandas')
export class ComandaController {
  constructor(private readonly comandaService: ComandaService) {}

  /** SK-002: Tomar comanda */
  @Post()
  @ApiOperation({
    summary: 'Tomar comanda (SK-002 / HU-M1-CMD-001)',
    description:
      'Registra una nueva comanda con sus líneas de producto. ' +
      'Cada línea puede incluir modificadores y notas libres. ' +
      'El sistema emite EVT-002 (ComandaCreada) que dispara el envío a KDS. ' +
      'Invariante INV-012: la comanda queda ligada a un servicio activo.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['servicioId', 'camareroId', 'lineas'],
      properties: {
        servicioId: { type: 'string', format: 'uuid', example: 'srv-uuid' },
        camareroId: { type: 'string', format: 'uuid', example: 'emp-uuid' },
        lineas: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['productoId', 'cantidad'],
            properties: {
              productoId: { type: 'string', format: 'uuid' },
              cantidad: { type: 'integer', minimum: 1, example: 2 },
              modificadores: {
                type: 'array',
                items: { type: 'string' },
                example: ['Sin cebolla', 'Punto medio'],
              },
              notas: { type: 'string', example: 'Sin sal' },
            },
          },
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Comanda creada y enviada a KDS' })
  @ApiBadRequestResponse({ description: 'Servicio no activo o producto no válido' })
  tomarComanda(
    @Body()
    body: {
      servicioId: string;
      camareroId: string;
      lineas: Array<{
        productoId: string;
        cantidad: number;
        modificadores?: string[];
        notas?: string;
      }>;
    },
  ) {
    return this.comandaService.tomarComanda(body);
  }

  /** SK-003: Calcular cuenta de un servicio */
  @Get('servicio/:servicioId/cuenta')
  @ApiOperation({
    summary: 'Calcular cuenta del servicio (SK-003)',
    description:
      'Devuelve el total desglosado por línea con base imponible, cuota IVA y total. ' +
      'Verifica INV-002 (integridad total) e INV-003 (cuadre IVA). ' +
      'No modifica estado; es idempotente.',
  })
  @ApiParam({ name: 'servicioId', description: 'UUID del servicio activo', type: 'string' })
  @ApiOkResponse({ description: 'Cuenta desglosada por línea e IVA' })
  @ApiNotFoundResponse({ description: 'Servicio no encontrado' })
  calcularCuenta(@Param('servicioId') servicioId: string) {
    return this.comandaService.calcularCuenta(servicioId);
  }

  /** SK-004: Dividir cuenta */
  @Post('servicio/:servicioId/dividir')
  @ApiOperation({
    summary: 'Dividir cuenta (SK-004 / HU-M1-COB-003)',
    description:
      'Divide la cuenta de un servicio en partes. ' +
      'Modos disponibles: `partes_iguales` (requiere numPartes) o `por_productos` (requiere grupos). ' +
      'Invariante INV-013: la suma de partes debe igualar el total original (±0.01 € por redondeo).',
  })
  @ApiParam({ name: 'servicioId', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['modo'],
      properties: {
        modo: {
          type: 'string',
          enum: ['partes_iguales', 'por_productos'],
          example: 'partes_iguales',
        },
        numPartes: { type: 'integer', minimum: 2, example: 3 },
        grupos: {
          type: 'array',
          description: 'Solo para modo por_productos',
          items: {
            type: 'object',
            properties: {
              lineasIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
            },
          },
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Array de sub-cuentas; suma == total original (INV-013)' })
  @ApiBadRequestResponse({ description: 'Número de partes inválido o grupos no cubren todas las líneas' })
  dividirCuenta(
    @Param('servicioId') servicioId: string,
    @Body()
    body: {
      modo: 'partes_iguales' | 'por_productos';
      numPartes?: number;
      grupos?: Array<{ lineasIds: string[] }>;
    },
  ) {
    return this.comandaService.dividirCuenta({
      servicioId,
      metodo: body.modo,
      config: {
        numPartes: body.numPartes,
        grupos: body.grupos,
      },
    });
  }

  /** OP-003: Anular línea de comanda */
  @Delete('lineas/:lineaId')
  @ApiOperation({
    summary: 'Anular línea de comanda (HU-M1-CMD-005)',
    description:
      'Anula una línea antes de que esté en preparación. ' +
      'Si ya está `en_preparacion`, requiere rol GERENTE o ADMIN. ' +
      'El stock no se descuenta si la línea se anula antes del cobro.',
  })
  @ApiParam({ name: 'lineaId', description: 'UUID de la línea de comanda', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['motivo', 'empleadoId', 'rolEmpleado'],
      properties: {
        motivo: { type: 'string', example: 'Error al teclear' },
        empleadoId: { type: 'string', format: 'uuid' },
        rolEmpleado: {
          type: 'string',
          enum: ['ADMIN', 'GERENTE', 'CAMARERO', 'COCINERO', 'BARMAN', 'CAJERO'],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Línea anulada; stock revertido si procede' })
  @ApiBadRequestResponse({ description: 'Línea no anulable (ya cobrada)' })
  anularLinea(
    @Param('lineaId') lineaId: string,
    @Body() body: { motivo: string; empleadoId: string; rolEmpleado: string },
  ) {
    return this.comandaService.anularLinea({
      lineaId,
      ...body,
    });
  }
}
