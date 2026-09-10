import { Controller, Get, Patch, Param, Query, Sse } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { KdsService } from '../services/kds.service';

interface MessageEvent {
  data: string | object;
  type?: string;
}

/**
 * HU-M1-CMD-003: KDS Cocina — Pantalla de cocina en tiempo real
 * HU-M1-CMD-004: KDS Barra — Pantalla de barra
 *
 * SSE endpoint para pantallas KDS + CRUD operaciones
 */
@ApiTags('KDS')
@ApiBearerAuth('JWT')
@Controller('kds')
export class KdsController {
  constructor(private readonly kdsService: KdsService) {}

  /**
   * SSE: Stream en tiempo real para pantallas KDS
   * GET /api/v1/kds/stream
   */
  @Sse('stream')
  @ApiOperation({
    summary: 'Stream SSE en tiempo real para pantalla KDS (HU-M1-CMD-003/004)',
    description:
      'Endpoint Server-Sent Events. La pantalla KDS se suscribe y recibe eventos push: ' +
      '`nueva_comanda`, `plato_listo`, `comanda_lista`. ' +
      '**Nota**: no usar con el botón "Try it out" de Swagger; usar curl o EventSource.',
  })
  stream(): Observable<MessageEvent> {
    return this.kdsService.getStream().pipe(
      map((event) => ({
        type: event.type,
        data: JSON.stringify(event.data),
      })),
    );
  }

  /**
   * GET /api/v1/kds/pendientes?destino=COCINA|BARRA
   * Obtener comandas pendientes filtradas por destino (POL-010)
   */
  @Get('pendientes')
  @ApiOperation({
    summary: 'Comandas pendientes por destino (POL-010)',
    description:
      'Devuelve las comandas con líneas pendientes o en preparación para el destino indicado. ' +
      'COCINA recibe platos; BARRA recibe bebidas. ' +
      'Las líneas se ordenan por hora de entrada (FIFO).',
  })
  @ApiQuery({ name: 'destino', required: false, enum: ['COCINA', 'BARRA'], description: 'Destino KDS (defecto: COCINA)' })
  @ApiOkResponse({ description: 'Array de lineas pendientes ordenadas por tiempo' })
  obtenerPendientes(@Query('destino') destino: 'COCINA' | 'BARRA' = 'COCINA') {
    return this.kdsService.obtenerComandasPendientes(destino);
  }

  /**
   * PATCH /api/v1/kds/lineas/:lineaId/listo
   * Marcar un plato individual como listo → EVT-003
   */
  @Patch('lineas/:lineaId/listo')
  @ApiOperation({
    summary: 'Marcar plato individual como listo (EVT-003)',
    description:
      'El cocinero/barman marca un plato como preparado. ' +
      'Emite EVT-003 (PlatoListo) que notifica en tiempo real al camarero. ' +
      'Si todas las líneas de la comanda están listas, la comanda pasa automáticamente a `lista`.',
  })
  @ApiParam({ name: 'lineaId', description: 'UUID de la línea de comanda', type: 'string' })
  @ApiOkResponse({ description: 'Línea marcada como lista; notificación SSE emitida' })
  marcarPlatoListo(@Param('lineaId') lineaId: string) {
    return this.kdsService.marcarPlatoListo(lineaId);
  }

  /**
   * PATCH /api/v1/kds/comandas/:comandaId/lista
   * Marcar toda la comanda como lista
   */
  @Patch('comandas/:comandaId/lista')
  @ApiOperation({
    summary: 'Marcar comanda completa como lista',
    description:
      'Marca todas las líneas pendientes de una comanda como listas de golpe. ' +
      'Equivalente a marcar cada plato individualmente pero en una sola llamada.',
  })
  @ApiParam({ name: 'comandaId', description: 'UUID de la comanda', type: 'string' })
  @ApiOkResponse({ description: 'Comanda completa marcada como lista' })
  marcarComandaLista(@Param('comandaId') comandaId: string) {
    return this.kdsService.marcarComandaLista(comandaId);
  }
}
