import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '@common/prisma/prisma.service';
import { VeriFactuRegistroDto } from './verifactu-registro.dto';

/**
 * Implements the VeriFactu hash chain logic as per RD 1007/2023.
 * This service is responsible for creating and verifying VeriFactu records.
 *
 * - INV-007 (Inalterability): Ensured by only providing a 'create' method. The database schema
 *   should enforce immutability (e.g., via triggers or permissions).
 * - INV-008 (Hash Chain): Implemented in `crearRegistro` by chaining the SHA-256 hash
 *   of the current record with the hash of the previous one.
 * - HU-M1-COB-006 (Ticket VeriFactu): This service provides the core logic for this user story.
 */
@Injectable()
export class VeriFactuService {
  private readonly logger = new Logger(VeriFactuService.name);

  constructor(private readonly prisma: PrismaService) {}

  async crearRegistro(
    tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
    serieId: string,
    datos: VeriFactuRegistroDto,
  ): Promise<{ id: string; hash: string }> {
    this.logger.log(`Creando registro VeriFactu para ticket ${datos.ticketId} en serie ${serieId}`);

    const ultimoRegistro = await tx.registroVeriFactu.findFirst({
      where: { ticket: { serieFacturacionId: serieId } },
      orderBy: { createdAt: 'desc' },
    });

    const hashAnterior = ultimoRegistro ? ultimoRegistro.hashActual : 'GENESIS';
    this.logger.debug(`Hash anterior encontrado: ${hashAnterior}`);

    const datosParaHashear = JSON.stringify(datos);
    const contenidoCompleto = datosParaHashear + hashAnterior;

    const hashActual = createHash('sha256').update(contenidoCompleto).digest('hex');
    this.logger.debug(`Nuevo hash calculado: ${hashActual}`);

    const nuevoRegistro = await tx.registroVeriFactu.create({
      data: {
        ticket: { connect: { id: datos.ticketId } },
        datosRegistro: datosParaHashear,
        hashActual: hashActual,
        hashAnterior: hashAnterior,
      },
    });

    this.logger.log(`Registro VeriFactu ${nuevoRegistro.id} creado con éxito.`);
    return { id: nuevoRegistro.id, hash: nuevoRegistro.hashActual };
  }

  async verificarCadena(serieId: string): Promise<{ integra: boolean; primerError?: string }> {
    const registros = await this.prisma.registroVeriFactu.findMany({
      where: { ticket: { serieFacturacionId: serieId } },
      orderBy: { createdAt: 'asc' },
    });

    if (registros.length === 0) {
      return { integra: true };
    }

    let hashAnteriorEsperado = 'GENESIS';

    for (const registro of registros) {
      if (registro.hashAnterior !== hashAnteriorEsperado) {
        return {
          integra: false,
          primerError: `Ruptura de cadena en registro ${registro.id}. Hash anterior esperado: ${hashAnteriorEsperado}, encontrado: ${registro.hashAnterior}`,
        };
      }

      const datosParaHashear = registro.datosRegistro;
      const contenidoCompleto = datosParaHashear + registro.hashAnterior;
      const hashCalculado = createHash('sha256').update(contenidoCompleto).digest('hex');

      if (registro.hashActual !== hashCalculado) {
        return {
          integra: false,
          primerError: `Hash corrupto en registro ${registro.id}. El hash no coincide con los datos.`,
        };
      }

      hashAnteriorEsperado = registro.hashActual;
    }

    return { integra: true };
  }
}