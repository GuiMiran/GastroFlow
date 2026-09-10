import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * VeriFactu Service — RD 1007/2023
 *
 * Invariantes garantizadas:
 *   INV-001: Numeración secuencial sin saltos (N+1 = N + 1)
 *   INV-007: Registro VeriFactu NUNCA se modifica ni elimina
 *   INV-008: Cadena hash ininterrumpida (cada registro contiene hash del anterior)
 *
 * Reglas aplicadas:
 *   RN-014: Numeración secuencial SIN saltos ni huecos
 *   RN-017: Inalterabilidad, hash SHA-256 encadenado, trazabilidad, conservación 4 años
 */
@Injectable()
export class VeriFactuService {
  private readonly logger = new Logger(VeriFactuService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el siguiente número secuencial para una serie de facturación.
   * INV-001: N+1 = N + 1, siempre.
   *
   * IMPORTANTE: Ejecutar dentro de transacción con lock para evitar saltos.
   */
  async obtenerSiguienteNumero(
    serieFacturacionId: string,
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
  ): Promise<{ numero: number; codigoCompleto: string }> {
    // Lock de la serie para evitar condiciones de carrera
    const serie = await tx.serieFacturacion.update({
      where: { id: serieFacturacionId },
      data: { ultimoNumero: { increment: 1 } },
    });

    const numero = serie.ultimoNumero;
    const codigoCompleto = `${serie.prefijo}-${serie.year}-${String(numero).padStart(6, '0')}`;

    this.logger.log(`INV-001 OK: Serie ${serie.prefijo} → ${codigoCompleto}`);
    return { numero, codigoCompleto };
  }

  /**
   * Obtiene el hash del último registro VeriFactu de la cadena.
   * INV-008: Cada registro contiene hash del anterior.
   *
   * Si no hay registros previos, devuelve "GENESIS" (inicio de cadena).
   */
  async obtenerUltimoHash(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
  ): Promise<string> {
    const ultimo = await tx.registroVeriFactu.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { hashActual: true },
    });

    return ultimo?.hashActual ?? 'GENESIS';
  }

  /**
   * Genera el hash SHA-256 para un registro VeriFactu.
   * RN-017: Hash SHA-256 encadenado.
   *
   * El hash se calcula sobre: datos del ticket + hash anterior
   */
  generarHash(datos: VeriFactuDatos, hashAnterior: string): string {
    const payload = JSON.stringify({
      ...datos,
      hashAnterior,
    });

    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Crea un registro VeriFactu inmutable.
   * INV-007: NUNCA se modifica ni elimina.
   * INV-008: Cadena hash ininterrumpida.
   */
  async crearRegistro(
    ticketId: string,
    datos: VeriFactuDatos,
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
  ): Promise<{ hashActual: string; hashAnterior: string }> {
    const hashAnterior = await this.obtenerUltimoHash(tx);
    const hashActual = this.generarHash(datos, hashAnterior);

    await tx.registroVeriFactu.create({
      data: {
        ticketId,
        hashActual,
        hashAnterior,
        datosRegistro: JSON.stringify(datos),
      },
    });

    this.logger.log(
      `INV-007/008 OK: VeriFactu ${datos.codigoCompleto} hash=${hashActual.substring(0, 12)}... prev=${hashAnterior.substring(0, 12)}...`,
    );

    return { hashActual, hashAnterior };
  }

  /**
   * Verifica la integridad de la cadena VeriFactu.
   * Recorre todos los registros y comprueba que no se haya roto la cadena.
   */
  async verificarCadena(): Promise<{ integra: boolean; errores: string[] }> {
    const registros = await this.prisma.registroVeriFactu.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const errores: string[] = [];
    let hashEsperado = 'GENESIS';

    for (const reg of registros) {
      if (reg.hashAnterior !== hashEsperado) {
        errores.push(
          `Rotura de cadena en registro ${reg.id}: esperado=${hashEsperado.substring(0, 12)}, encontrado=${reg.hashAnterior.substring(0, 12)}`,
        );
      }

      // Re-calcular hash para verificar datos no manipulados
      const datos: VeriFactuDatos = JSON.parse(reg.datosRegistro);
      const hashRecalculado = this.generarHash(datos, reg.hashAnterior);
      if (hashRecalculado !== reg.hashActual) {
        errores.push(
          `Hash corrupto en registro ${reg.id}: datos manipulados`,
        );
      }

      hashEsperado = reg.hashActual;
    }

    return { integra: errores.length === 0, errores };
  }
}

/**
 * Datos que se incluyen en el hash VeriFactu
 */
export interface VeriFactuDatos {
  codigoCompleto: string;
  tipo: string;
  fechaEmision: string;
  nifEmisor: string;
  nombreEmisor: string;
  totalSinIva: number;
  totalIva: number;
  total: number;
  desglose: {
    base4: number; iva4: number;
    base10: number; iva10: number;
    base21: number; iva21: number;
  };
}
