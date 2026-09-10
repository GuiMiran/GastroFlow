import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CobroService } from '../services/cobro.service';

@ApiTags('Cobros')
@ApiBearerAuth('JWT')
@Controller('cobros')
export class CobroController {
  constructor(private readonly cobroService: CobroService) {}

  /** HU-M1-COB-008 (detalle): Factura completa con lineas para imprimir/WhatsApp */
  @Get('tickets/:id')
  @ApiOperation({
    summary: 'Obtener ticket/factura completa por ID (HU-M1-COB-008)',
    description:
      'Devuelve el detalle completo del ticket incluyendo todas las líneas, desglose de IVA ' +
      'por tipo, hash VeriFactu y estado del ciclo de vida. ' +
      'Usado para imprimir o enviar por WhatsApp al cliente (SK-006).',
  })
  @ApiParam({ name: 'id', description: 'UUID del ticket', type: 'string' })
  @ApiOkResponse({ description: 'Ticket completo con desglose IVA y hash VeriFactu' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado' })
  obtenerTicket(@Param('id') id: string) {
    return this.cobroService.obtenerTicketCompleto(id);
  }

  /** HU-M1-COB-008: Listado de tickets/facturas del día con ciclo de vida */
  @Get('tickets')
  @ApiOperation({
    summary: 'Listar tickets del día (HU-M1-COB-008)',
    description:
      'Devuelve todos los tickets de un establecimiento para la fecha indicada (defecto: hoy). ' +
      'Incluye estado (emitido/cobrado/rectificado/anulado) para el ciclo de vida.',
  })
  @ApiQuery({ name: 'establecimientoId', required: true, description: 'UUID del establecimiento' })
  @ApiQuery({ name: 'fecha', required: false, description: 'ISO date YYYY-MM-DD (defecto: hoy)' })
  @ApiOkResponse({ description: 'Array de tickets con totales y estado' })
  listarTickets(
    @Query('establecimientoId') establecimientoId: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.cobroService.listarTickets({ establecimientoId, fecha });
  }

  /** SK-005 + SK-006: Cobrar servicio y emitir ticket VeriFactu */
  @Post('servicio/:servicioId')
  @ApiOperation({
    summary: 'Cobrar servicio y emitir ticket VeriFactu (SK-005, SK-006)',
    description:
      'Registra el cobro del servicio, cierra la mesa y genera el ticket fiscalizado. ' +
      '**Invariantes críticas**: INV-002 (cuadre total), INV-003 (cuadre IVA), ' +
      'INV-007 (inalterabilidad VeriFactu), INV-008 (cadena hash). ' +
      'Emitíe EVT-001 (TicketEmitido) que genera asiento contable automático.',
  })
  @ApiParam({ name: 'servicioId', description: 'UUID del servicio a cobrar', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['formasPago'],
      properties: {
        formasPago: {
          type: 'array',
          description: 'Suma debe igualar el total de la cuenta (INV-014)',
          items: {
            type: 'object',
            required: ['forma', 'importe'],
            properties: {
              forma: {
                type: 'string',
                enum: ['efectivo', 'tarjeta', 'bizum', 'invitacion'],
                example: 'tarjeta',
              },
              importe: { type: 'number', minimum: 0.01, example: 20.35 },
            },
          },
        },
        clienteId: {
          type: 'string',
          format: 'uuid',
          description: 'Opcional: UUID del cliente para fidelización (M4-CRM)',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Ticket emitido con hash VeriFactu (INV-007, INV-008)' })
  @ApiBadRequestResponse({ description: 'Importe cobrado no cubre el total (INV-014)' })
  cobrar(
    @Param('servicioId') servicioId: string,
    @Body()
    body: {
      formasPago: Array<{ forma: 'efectivo' | 'tarjeta' | 'bizum' | 'invitacion'; importe: number }>;
      clienteId?: string;
    },
  ) {
    return this.cobroService.cobrarServicio({ servicioId, ...body });
  }

  /** SK-007: Emitir factura completa a partir de ticket */
  @Post('factura-completa')
  @ApiOperation({
    summary: 'Emitir factura completa a partir de ticket (SK-007 / HU-M1-COB-006)',
    description:
      'Genera una factura completa (con datos del destinatario) a partir de un ticket simplificado. ' +
      'La factura mantiene el mismo número de serie VeriFactu y hereda el hash (INV-001).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ticketId', 'destinatarioNif', 'destinatarioNombre', 'destinatarioDireccion', 'establecimientoId'],
      properties: {
        ticketId: { type: 'string', format: 'uuid' },
        destinatarioNif: { type: 'string', example: 'B12345678' },
        destinatarioNombre: { type: 'string', example: 'Empresa Cliente SL' },
        destinatarioDireccion: { type: 'string', example: 'Calle Mayor 1, Madrid' },
        establecimientoId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Factura completa emitida y registrada en libro IVA' })
  facturaCompleta(
    @Body()
    body: {
      ticketId: string;
      destinatarioNif: string;
      destinatarioNombre: string;
      destinatarioDireccion: string;
      establecimientoId: string;
    },
  ) {
    return this.cobroService.emitirFacturaCompleta(body);
  }

  /** SK-008: Emitir factura rectificativa */
  @Post('rectificativa')
  @ApiOperation({
    summary: 'Emitir factura rectificativa (SK-008 / HU-M1-COB-007)',
    description:
      'Genera una factura rectificativa vinculada al ticket original. ' +
      'Tipos: `sustitucion` (reemplaza completamente) o `diferencias` (anota la diferencia). ' +
      'El ticket original queda en estado `rectificado` (INV-007: inalterabilidad).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ticketOriginalId', 'tipoRectificacion', 'motivo', 'establecimientoId'],
      properties: {
        ticketOriginalId: { type: 'string', format: 'uuid' },
        tipoRectificacion: {
          type: 'string',
          enum: ['sustitucion', 'diferencias'],
          example: 'diferencias',
        },
        motivo: { type: 'string', example: 'Error en tipo de IVA aplicado' },
        establecimientoId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Factura rectificativa emitida; ticket original marcado como rectificado' })
  rectificativa(
    @Body()
    body: {
      ticketOriginalId: string;
      tipoRectificacion: 'sustitucion' | 'diferencias';
      motivo: string;
      establecimientoId: string;
    },
  ) {
    return this.cobroService.emitirRectificativa(body);
  }
}
