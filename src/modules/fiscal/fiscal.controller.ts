import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FiscalService } from './fiscal.service';

@ApiTags('Fiscal')
@ApiBearerAuth('JWT')
/**
 * M3-FISCAL: Exposición HTTP de cálculos fiscales
 *
 * SK-040: calcular_iva_trimestral
 * SK-041: generar_modelo_303
 * SK-042: generar_libro_registro
 */
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  /** SK-040: IVA repercutido vs soportado del trimestre */
  @Get('iva-trimestral')
  @ApiOperation({
    summary: 'IVA repercutido vs soportado del trimestre (SK-040/041 / INV-004, INV-005, INV-006)',
    description:
      'Calcula el IVA repercutido (ventas) y el soportado deducible (compras) del trimestre. ' +
      '**Invariante INV-004**: total repercutido = suma cuotas tickets del período. ' +
      '**Invariante INV-005**: total soportado = suma cuotas facturas compra aceptadas. ' +
      '**Invariante INV-006**: resultado = repercutido - soportado (positivo = a pagar).',
  })
  @ApiQuery({ name: 'year', required: true, description: 'Ejercicio fiscal (ej: 2026)', example: '2026' })
  @ApiQuery({ name: 'trimestre', required: true, description: '1-4', example: '1' })
  @ApiOkResponse({ description: 'Desglose por tipo IVA + resultado neto (INV-006)' })
  calcularIvaTrimestral(
    @Query('year') year: string,
    @Query('trimestre') trimestre: string,
  ) {
    return this.fiscalService.calcularIvaTrimestral(
      parseInt(year),
      parseInt(trimestre),
    );
  }

  /** SK-041: Datos para Modelo 303 */
  @Get('modelo303')
  @ApiOperation({
    summary: 'Generar borrador Modelo 303 (SK-042 / HU-M3-IMP-002)',
    description:
      'Genera los valores calculados de las casillas del Modelo 303 (declaración trimestral de IVA). ' +
      'Casillas principales: 01/03 (21%), 04/06 (10%), 07/09 (4%), 27 (total repercutido), ' +
      '29 (total deducible), 46 (resultado final). ' +
      'El borrador se exporta; la presentación a la AEAT es externa.',
  })
  @ApiQuery({ name: 'year', required: true, example: '2026' })
  @ApiQuery({ name: 'trimestre', required: true, description: '1-4', example: '1' })
  @ApiOkResponse({ description: 'Casillas del Modelo 303 calculadas (INV-006)' })
  generarModelo303(
    @Query('year') year: string,
    @Query('trimestre') trimestre: string,
  ) {
    return this.fiscalService.generarModelo303(
      parseInt(year),
      parseInt(trimestre),
    );
  }

  /** SK-042: Libro registro de facturas emitidas y recibidas */
  @Get('libro-registro')
  @ApiOperation({
    summary: 'Libro registro de facturas emitidas y recibidas (SK-046/047)',
    description:
      'Genera el libro registro oficial de facturas emitidas y recibidas del trimestre. ' +
      'Formato conforme al RD 1619/2012 y requisitos VeriFactu (RD 1007/2023). ' +
      'Incluye número de factura, NIF emisor/receptor, base imponible, cuota IVA y total.',
  })
  @ApiQuery({ name: 'year', required: true, example: '2026' })
  @ApiQuery({ name: 'trimestre', required: true, description: '1-4', example: '1' })
  @ApiOkResponse({ description: 'Libro registro estructurado por emitidas y recibidas' })
  generarLibroRegistro(
    @Query('year') year: string,
    @Query('trimestre') trimestre: string,
  ) {
    return this.fiscalService.generarLibroRegistro(
      parseInt(year),
      parseInt(trimestre),
    );
  }
}
