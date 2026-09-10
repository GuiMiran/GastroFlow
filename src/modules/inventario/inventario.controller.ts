import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventarioService } from './inventario.service';

@ApiTags('Inventario')
@ApiBearerAuth('JWT')
/**
 * HU-M2-INV-001: Stock automático (EVT-004 listener, no endpoint)
 * HU-M2-INV-002: Alertas stock mínimo
 * HU-M2-INV-003: Inventario manual (conteo)
 * HU-M2-INV-005: Traspaso entre almacenes
 */
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  /** Listar almacenes del establecimiento */
  @Get('almacenes')
  @ApiOperation({
    summary: 'Listar almacenes del establecimiento',
    description:
      'Devuelve todos los almacenes del establecimiento. ' +
      'Cada almacén es un contenedor de stock físico (ej: almacén principal, cámara, barra).',
  })
  @ApiQuery({ name: 'establecimientoId', required: true })
  @ApiOkResponse({ description: 'Array de almacenes activos' })
  listarAlmacenes(@Query('establecimientoId') establecimientoId: string) {
    return this.inventarioService.listarAlmacenes(establecimientoId);
  }

  /** SK-011: Consultar stock actual */
  @Get('stock')
  @ApiOperation({
    summary: 'Consultar stock actual por almacén (SK-011 / INV-020)',
    description:
      'Devuelve el stock de todos los ingredientes en el almacén especificado. ' +
      'El campo `alerta: true` indica que la cantidad está por debajo del stock mínimo (INV-020).',
  })
  @ApiQuery({ name: 'almacenId', required: false, description: 'UUID del almacén (si no se especifica, devuelve todos)' })
  @ApiOkResponse({ description: 'Stock por ingrediente con alertas (INV-020)' })
  consultarStock(@Query('almacenId') almacenId?: string) {
    return this.inventarioService.consultarStock(almacenId);
  }

  /** HU-M2-INV-003: Registrar conteo de inventario manual */
  @Post('conteo')
  @ApiOperation({
    summary: 'Registrar conteo de inventario físico (HU-M2-INV-003 / SK-014)',
    description:
      'Ajusta el stock actual con los valores contados físicamente. ' +
      'Las diferencias (ajustes) quedan registradas con timestamp para auditoría. ' +
      'Invariante INV-022: el stock no puede ser negativo tras el ajuste.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['almacenId', 'conteos'],
      properties: {
        almacenId: { type: 'string', format: 'uuid' },
        conteos: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['ingredienteId', 'cantidadContada'],
            properties: {
              ingredienteId: { type: 'string', format: 'uuid' },
              cantidadContada: { type: 'number', minimum: 0, example: 4.50 },
            },
          },
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Conteo registrado; stock ajustado e historial guardado' })
  registrarConteo(
    @Body()
    body: {
      almacenId: string;
      conteos: Array<{
        ingredienteId: string;
        cantidadContada: number;
      }>;
    },
  ) {
    return this.inventarioService.registrarConteo(body);
  }

  /** HU-M2-INV-005: Traspaso entre almacenes */
  @Post('traspaso')
  @ApiOperation({
    summary: 'Traspaso de stock entre almacenes (HU-M2-INV-005 / SK-015)',
    description:
      'Mueve una cantidad de ingrediente de un almacén origen a uno destino. ' +
      'El stock total no cambia; solo se redistribuye. ' +
      'Invariante INV-021: el almacén origen debe tener suficiente stock.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ingredienteId', 'almacenOrigenId', 'almacenDestinoId', 'cantidad'],
      properties: {
        ingredienteId: { type: 'string', format: 'uuid' },
        almacenOrigenId: { type: 'string', format: 'uuid' },
        almacenDestinoId: { type: 'string', format: 'uuid' },
        cantidad: { type: 'number', minimum: 0.001, example: 2.0 },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Traspaso registrado; ambos almacenes actualizados' })
  traspasoStock(
    @Body()
    body: {
      ingredienteId: string;
      almacenOrigenId: string;
      almacenDestinoId: string;
      cantidad: number;
    },
  ) {
    return this.inventarioService.traspasoStock(body);
  }
}
