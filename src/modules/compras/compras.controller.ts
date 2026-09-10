import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComprasService } from './compras.service';

@ApiTags('Compras')
@ApiBearerAuth('JWT')
/**
 * HU-M2-COM-001: Proveedores
 * HU-M2-COM-002: Pedidos
 * HU-M2-COM-003: Albaranes
 * HU-M2-COM-004: Facturas compra
 */
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  // ─── Proveedores ───

  @Post('proveedores')
  @ApiOperation({
    summary: 'Crear proveedor (HU-M2-COM-001)',
    description:
      'Registra un nuevo proveedor. El NIF es único por establecimiento. ' +
      'El proveedor se asocia a pedidos, albaranes y facturas de compra.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['establecimientoId', 'nombre', 'nif'],
      properties: {
        establecimientoId: { type: 'string', format: 'uuid' },
        nombre: { type: 'string', example: 'Distribuciones Rodríguez SL' },
        nif: { type: 'string', example: 'B12345678' },
        direccion: { type: 'string', example: 'Pol. Industrial Las Rozas, nave 4' },
        telefono: { type: 'string', example: '91 000 00 00' },
        email: { type: 'string', format: 'email', example: 'pedidos@rodriguez.es' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Proveedor creado' })
  crearProveedor(
    @Body()
    body: {
      establecimientoId: string;
      nombre: string;
      nif: string;
      direccion?: string;
      telefono?: string;
      email?: string;
    },
  ) {
    return this.comprasService.crearProveedor(body);
  }

  @Get('proveedores')
  @ApiOperation({ summary: 'Listar proveedores del establecimiento' })
  @ApiQuery({ name: 'establecimientoId', required: true })
  @ApiOkResponse({ description: 'Array de proveedores activos' })
  listarProveedores(@Query('establecimientoId') establecimientoId: string) {
    return this.comprasService.listarProveedores(establecimientoId);
  }

  @Get('proveedores/:id')
  @ApiOperation({ summary: 'Obtener proveedor por ID con sus pedidos y facturas' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Proveedor con historial' })
  @ApiNotFoundResponse({ description: 'Proveedor no encontrado' })
  obtenerProveedor(@Param('id') id: string) {
    return this.comprasService.obtenerProveedor(id);
  }

  // ─── Pedidos ───

  @Post('pedidos')
  @ApiOperation({
    summary: 'Crear pedido a proveedor (SK-020 / HU-M2-COM-002)',
    description:
      'Genera un pedido pendiente al proveedor. Las líneas incluyen ingredientes con cantidad pedida. ' +
      'El pedido se confirma automáticamente al registrar el albarán de entrada (SK-021).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['proveedorId', 'lineas'],
      properties: {
        proveedorId: { type: 'string', format: 'uuid' },
        fechaEntrega: { type: 'string', format: 'date-time', description: 'ISO 8601 fecha estimada de entrega' },
        lineas: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['ingredienteId', 'descripcion', 'cantidadPedida', 'unidadMedida'],
            properties: {
              ingredienteId: { type: 'string', format: 'uuid' },
              descripcion: { type: 'string', example: 'Lechuga romana (bandeja 6 uds)' },
              cantidadPedida: { type: 'number', minimum: 0.001, example: 10 },
              unidadMedida: { type: 'string', example: 'kg' },
              precioEstimado: { type: 'number', minimum: 0, example: 1.20 },
            },
          },
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Pedido creado en estado pendiente' })
  crearPedido(
    @Body()
    body: {
      proveedorId: string;
      fechaEntrega?: string;
      lineas: Array<{
        ingredienteId: string;
        descripcion: string;
        cantidadPedida: number;
        unidadMedida: string;
        precioEstimado?: number;
      }>;
    },
  ) {
    return this.comprasService.crearPedido({
      ...body,
      fechaEntrega: body.fechaEntrega ? new Date(body.fechaEntrega) : undefined,
    });
  }

  @Get('pedidos')
  @ApiOperation({ summary: 'Listar pedidos de un proveedor' })
  @ApiQuery({ name: 'proveedorId', required: true })
  @ApiOkResponse({ description: 'Pedidos ordenados por fecha desc' })
  listarPedidos(@Query('proveedorId') proveedorId: string) {
    return this.comprasService.listarPedidos(proveedorId);
  }

  // ─── Albaranes ───

  @Post('albaranes')
  @ApiOperation({
    summary: 'Registrar albarán de entrada (SK-021 / HU-M2-COM-003)',
    description:
      'Registra la recepción de mercancía. ' +
      'Si hay pedido previo, se vincula y las desviaciones se registran. ' +
      'El albarán dispara EVT-004 (MercanciaRecibida) que actualiza el stock del almacén (INV-022).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['proveedorId', 'numeroAlbaran', 'almacenId', 'lineas'],
      properties: {
        proveedorId: { type: 'string', format: 'uuid' },
        pedidoId: { type: 'string', format: 'uuid', description: 'Opcional: vincular a pedido existente' },
        numeroAlbaran: { type: 'string', example: 'ALB-2026-0142' },
        almacenId: { type: 'string', format: 'uuid', description: 'Almacén donde se recibe la mercancía' },
        lineas: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['ingredienteId', 'cantidadRecibida'],
            properties: {
              ingredienteId: { type: 'string', format: 'uuid' },
              cantidadRecibida: { type: 'number', minimum: 0, example: 9.80 },
              cantidadEsperada: { type: 'number', minimum: 0, example: 10.0, description: 'Del pedido original' },
            },
          },
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Albarán registrado; stock actualizado en almacén' })
  registrarAlbaran(
    @Body()
    body: {
      proveedorId: string;
      pedidoId?: string;
      numeroAlbaran: string;
      almacenId: string;
      lineas: Array<{
        ingredienteId: string;
        cantidadRecibida: number;
        cantidadEsperada?: number;
      }>;
    },
  ) {
    return this.comprasService.registrarAlbaran(body);
  }

  @Get('albaranes')
  @ApiOperation({ summary: 'Listar albaranes de un proveedor' })
  @ApiQuery({ name: 'proveedorId', required: true })
  @ApiOkResponse({ description: 'Albaranes con desviaciones respecto al pedido' })
  listarAlbaranes(@Query('proveedorId') proveedorId: string) {
    return this.comprasService.listarAlbaranes(proveedorId);
  }

  // ─── Facturas compra ───

  @Post('facturas')
  @ApiOperation({
    summary: 'Registrar factura de compra (SK-022 / HU-M2-COM-004)',
    description:
      'Registra una factura recibida de proveedor con desglose de IVA por tipo. ' +
      'Genera automáticamente el asiento contable (SK-031) y la entrada en el Libro de Facturas Recibidas (SK-047). ' +
      '**Invariante INV-005**: el IVA soportado queda registrado para el Modelo 303.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['proveedorId', 'numeroFactura', 'fechaFactura'],
      properties: {
        proveedorId: { type: 'string', format: 'uuid' },
        numeroFactura: { type: 'string', example: 'FV-2026-0089' },
        fechaFactura: { type: 'string', format: 'date-time', description: 'ISO 8601' },
        baseImponible4: { type: 'number', minimum: 0, example: 0 },
        cuotaIva4: { type: 'number', minimum: 0, example: 0 },
        baseImponible10: { type: 'number', minimum: 0, example: 100.00 },
        cuotaIva10: { type: 'number', minimum: 0, example: 10.00 },
        baseImponible21: { type: 'number', minimum: 0, example: 50.00 },
        cuotaIva21: { type: 'number', minimum: 0, example: 10.50 },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Factura registrada; asiento y libro IVA generados (INV-005)' })
  registrarFactura(
    @Body()
    body: {
      proveedorId: string;
      numeroFactura: string;
      fechaFactura: string;
      baseImponible4?: number;
      cuotaIva4?: number;
      baseImponible10?: number;
      cuotaIva10?: number;
      baseImponible21?: number;
      cuotaIva21?: number;
    },
  ) {
    return this.comprasService.registrarFacturaCompra({
      ...body,
      fechaFactura: new Date(body.fechaFactura),
    });
  }

  @Get('facturas')
  @ApiOperation({ summary: 'Listar facturas de compra de un proveedor' })
  @ApiQuery({ name: 'proveedorId', required: true })
  @ApiOkResponse({ description: 'Facturas con proveedor, asiento contable y estado libro IVA' })
  listarFacturas(@Query('proveedorId') proveedorId: string) {
    return this.comprasService.listarFacturas(proveedorId);
  }
}
