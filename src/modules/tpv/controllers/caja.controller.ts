import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CajaService } from '../services/caja.service';

@ApiTags('Caja')
@ApiBearerAuth('JWT')
@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  /** Recuperar turno activo para una caja (para rehidratar frontend) */
  @Get('turno/activo')
  @ApiOperation({
    summary: 'Obtener turno activo de caja',
    description:
      'Rehidrata el estado de la caja al abrir el frontend. ' +
      'Devuelve el turno activo con su fondo de apertura y movimientos. ' +
      'Si no hay turno activo devuelve null (sin error).',
  })
  @ApiQuery({ name: 'cajaId', required: true, description: 'UUID de la caja física' })
  @ApiOkResponse({ description: 'Turno activo o null' })
  getTurnoActivo(@Query('cajaId') cajaId: string) {
    return this.cajaService.findTurnoActivo(cajaId);
  }

  /** OP-010: Abrir turno de caja */
  @Post('turno/abrir')
  @ApiOperation({
    summary: 'Abrir turno de caja (HU-M1-CAJ-001)',
    description:
      'Inicia un nuevo turno de caja con un fondo de apertura en efectivo. ' +
      'Solo puede haber un turno activo por caja (INV-015). ' +
      'El arqueo al cierre verifica: fondo + entradas - salidas = contado.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cajaId', 'empleadoId', 'fondoApertura'],
      properties: {
        cajaId: { type: 'string', format: 'uuid', example: 'caja-uuid' },
        empleadoId: { type: 'string', format: 'uuid', example: 'emp-uuid' },
        fondoApertura: { type: 'number', minimum: 0, example: 200.00, description: 'Efectivo inicial en euros' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Turno abierto con hora de inicio' })
  @ApiBadRequestResponse({ description: 'Ya existe un turno activo para esta caja' })
  abrirTurno(
    @Body() body: { cajaId: string; empleadoId: string; fondoApertura: number },
  ) {
    return this.cajaService.abrirTurno(body);
  }

  /** OP-012: Registrar movimiento de caja */
  @Post('turno/:turnoCajaId/movimiento')
  @ApiOperation({
    summary: 'Registrar movimiento de caja (entrada/salida)',
    description:
      'Registra una entrada o salida de efectivo durante el turno. ' +
      'Ejemplos: fondo entregado a proveedor (salida), propinas (entrada). ' +
      'Cada movimiento se incluye en el arqueo final (INV-015).',
  })
  @ApiParam({ name: 'turnoCajaId', description: 'UUID del turno activo', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['tipo', 'importe', 'concepto', 'empleadoId'],
      properties: {
        tipo: { type: 'string', enum: ['entrada', 'salida'], example: 'salida' },
        importe: { type: 'number', minimum: 0.01, example: 50.00 },
        concepto: { type: 'string', example: 'Pago proveedor pan' },
        empleadoId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Movimiento registrado' })
  registrarMovimiento(
    @Param('turnoCajaId') turnoCajaId: string,
    @Body()
    body: {
      tipo: 'entrada' | 'salida';
      importe: number;
      concepto: string;
      empleadoId: string;
    },
  ) {
    return this.cajaService.registrarMovimiento({ turnoCajaId, ...body });
  }

  /** OP-011: Cerrar turno (arqueo) */
  @Post('turno/:turnoCajaId/cerrar')
  @ApiOperation({
    summary: 'Cerrar turno y realizar arqueo (HU-M1-CAJ-002 / SK-009)',
    description:
      'Cierra el turno activo. El sistema calcula el teórico (fondo + entradas efectivo - salidas). ' +
      '`contadoEfectivo` es lo que el cajero cuenta físicamente. ' +
      'La diferencia (desúmero) se guarda para auditoría (INV-015). ' +
      'Se genera asiento de cierre de caja automáticamente.',
  })
  @ApiParam({ name: 'turnoCajaId', description: 'UUID del turno a cerrar', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['contadoEfectivo', 'empleadoId'],
      properties: {
        contadoEfectivo: { type: 'number', minimum: 0, example: 847.50 },
        empleadoId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOkResponse({ description: 'Turno cerrado con teórico, contado y diferencia' })
  cerrarTurno(
    @Param('turnoCajaId') turnoCajaId: string,
    @Body() body: { contadoEfectivo: number; empleadoId: string },
  ) {
    return this.cajaService.cerrarTurno({ turnoCajaId, ...body });
  }
}
