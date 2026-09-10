import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
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
import { MesaService } from '../services/mesa.service';

@ApiTags('Mesas')
@ApiBearerAuth('JWT')
@Controller('mesas')
export class MesaController {
  constructor(private readonly mesaService: MesaService) {}

  /** Abrir servicio de barra (sin mesa) */
  @Post('barra/abrir')
  @ApiOperation({
    summary: 'Abrir servicio de barra sin mesa asignada',
    description:
      'Crea un servicio de tipo barra. Útil para consumiciones directas sin ocupar mesa. ' +
      'Invariante INV-011: el servicio queda activo hasta que se cobra.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['camareroId'],
      properties: {
        camareroId: { type: 'string', format: 'uuid', example: 'emp-uuid' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Servicio de barra creado' })
  abrirBarra(@Body() body: { camareroId: string }) {
    return this.mesaService.abrirServicioBarra(body.camareroId);
  }

  /** SK-001: Abrir mesa → crear servicio */
  @Post(':mesaId/abrir')
  @ApiOperation({
    summary: 'Abrir mesa y crear servicio (SK-001 / HU-M1-SAL-002)',
    description:
      'Crea un servicio activo asociado a la mesa indicada. ' +
      'La mesa pasa a estado `ocupada` (INV-010). ' +
      'Si la mesa ya estaba ocupada devuelve 409. ' +
      'Registra hora de apertura y número de comensales.',
  })
  @ApiParam({ name: 'mesaId', description: 'UUID de la mesa', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['camareroId', 'comensales'],
      properties: {
        camareroId: { type: 'string', format: 'uuid', example: 'emp-uuid' },
        comensales: { type: 'integer', minimum: 1, example: 3 },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Servicio creado; mesa pasa a ocupada' })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  @ApiBadRequestResponse({ description: 'Mesa ya ocupada (INV-010)' })
  abrirMesa(
    @Param('mesaId') mesaId: string,
    @Body() body: { camareroId: string; comensales: number },
  ) {
    return this.mesaService.abrirMesa({
      mesaId,
      camareroId: body.camareroId,
      comensales: body.comensales,
    });
  }

  /** Consultar mapa de sala */
  @Get('establecimiento/:establecimientoId/mapa')
  @ApiOperation({
    summary: 'Obtener mapa de sala con estado de todas las mesas',
    description:
      'Devuelve todas las mesas del establecimiento con su estado actual (libre/ocupada/reservada) ' +
      'y el servicio activo si existe. Usado por el frontend TPV para pintar el mapa.',
  })
  @ApiParam({ name: 'establecimientoId', description: 'UUID del establecimiento', type: 'string' })
  @ApiOkResponse({ description: 'Array de mesas con estado y servicio activo' })
  mapaSala(@Param('establecimientoId') establecimientoId: string) {
    return this.mesaService.obtenerMapaSala(establecimientoId);
  }

  /** SAL-003: Mover servicio a mesa libre */
  @Patch('servicios/:servicioId/mover')
  @ApiOperation({
    summary: 'Mover servicio a otra mesa libre (HU-M1-SAL-003)',
    description:
      'Traslada todas las comandas del servicio a una mesa destino libre. ' +
      'La mesa origen queda libre. La mesa destino pasa a ocupada (INV-010, INV-011).',
  })
  @ApiParam({ name: 'servicioId', description: 'UUID del servicio a mover', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['mesaDestinoId'],
      properties: {
        mesaDestinoId: { type: 'string', format: 'uuid', example: 'mesa-uuid' },
      },
    },
  })
  @ApiOkResponse({ description: 'Servicio movido; ambas mesas actualizadas' })
  @ApiBadRequestResponse({ description: 'Mesa destino ya ocupada' })
  moverServicio(
    @Param('servicioId') servicioId: string,
    @Body() body: { mesaDestinoId: string },
  ) {
    return this.mesaService.moverServicio({ servicioId, mesaDestinoId: body.mesaDestinoId });
  }

  /** SAL-004: Unir dos mesas — mover comandas de origen a destino */
  @Post('servicios/unir')
  @ApiOperation({
    summary: 'Unir dos servicios en uno (HU-M1-SAL-004)',
    description:
      'Fusiona las comandas del servicio origen en el servicio destino. ' +
      'El servicio origen se cierra y su mesa queda libre. ' +
      'La cuenta unificada se consulta sobre el servicio destino (INV-013).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['servicioOrigenId', 'servicioDestinoId'],
      properties: {
        servicioOrigenId: { type: 'string', format: 'uuid' },
        servicioDestinoId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOkResponse({ description: 'Servicios unificados; mesa origen liberada' })
  unirServicios(@Body() body: { servicioOrigenId: string; servicioDestinoId: string }) {
    return this.mesaService.unirServicios(body);
  }
}
