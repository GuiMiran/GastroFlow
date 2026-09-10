import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AsientoService } from './asiento.service';

@ApiTags('Contabilidad')
@ApiBearerAuth('JWT')
/**
 * M3-CONTABLE: Exposición HTTP de consultas contables
 *
 * SK-031: consultar_balance
 * SK-032: exportar_diario
 */
@Controller('contable')
export class ContableController {
  constructor(private readonly asientoService: AsientoService) {}

  /**
   * SK-031: Balance de sumas y saldos por cuenta PGC
   * Params opcionales: desde, hasta (ISO date strings)
   */
  @Get('balance')
  @ApiOperation({
    summary: 'Balance de sumas y saldos (SK-034 / INV-030, INV-031)',
    description:
      'Devuelve el balance de sumas y saldos por cuenta PGC para el rango indicado. ' +
      '**Invariante INV-030**: partida doble — total debe = total haber. ' +
      '**Invariante INV-031**: cuentas de activo tienen saldo deudor; pasivo y patrimonio, acreedor.',
  })
  @ApiQuery({ name: 'desde', required: false, description: 'ISO date inicio (defecto: inicio del ejercicio)' })
  @ApiQuery({ name: 'hasta', required: false, description: 'ISO date fin (defecto: hoy)' })
  @ApiOkResponse({ description: 'Saldos por cuenta PGC con totales verificados (INV-031)' })
  consultarBalance(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.asientoService.consultarBalance({
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
    });
  }

  /**
   * SK-032: Libro diario — asientos contables en un rango
   * ?desde=2026-01-01&hasta=2026-03-31&establecimientoId=xxx
   */
  @Get('diario')
  @ApiOperation({
    summary: 'Libro diario: asientos en un rango de fechas (SK-033)',
    description:
      'Exporta todos los asientos contables del período ordenados por número de asiento. ' +
      'Los asientos se generan automáticamente al cobrar (SK-030) y al registrar compras (SK-031). ' +
      'Formato adecuado para exportar a PDF o auditoría.',
  })
  @ApiQuery({ name: 'desde', required: true })
  @ApiQuery({ name: 'hasta', required: true })
  @ApiQuery({ name: 'establecimientoId', required: false })
  @ApiOkResponse({ description: 'Array de asientos con líneas debe/haber (INV-030)' })
  exportarDiario(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Query('establecimientoId') establecimientoId?: string,
  ) {
    return this.asientoService.exportarDiario({
      desde: new Date(desde),
      hasta: new Date(hasta),
      establecimientoId,
    });
  }

  /** Cierre de Caja Diario: total facturado vs total cobrado */
  @Get('cierre')
  @ApiOperation({
    summary: 'Cierre diario de caja: facturado vs cobrado',
    description:
      'Devuelve el resumen del día: total facturado por tipo de IVA, total cobrado por forma de pago y diferencia. ' +
      'Usado para el informe de cláusiero diario (ITR). ' +
      'Invariante INV-015: total cobrado debe igualar total facturado cobrado.',
  })
  @ApiQuery({ name: 'establecimientoId', required: true })
  @ApiQuery({ name: 'fecha', required: false, description: 'ISO date (defecto: hoy)' })
  @ApiOkResponse({ description: 'Resumen de cierre con desglose por IVA y forma de pago' })
  cierreCaja(
    @Query('establecimientoId') establecimientoId: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.asientoService.cierreCaja({ establecimientoId, fecha });
  }
}
