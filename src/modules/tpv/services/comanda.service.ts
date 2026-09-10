import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ComandaRegistradaEvent, LineaComandaAnuladaEvent } from '../../../common/events/domain-events';
import {
  TIPOS_IVA,
  calcularBaseImponible,
  calcularCuotaIva,
  decimalToNumber,
} from '../../../common/types/iva';

/**
 * SK-002: tomar_comanda
 * SK-003: calcular_cuenta
 * SK-004: dividir_cuenta
 *
 * OP-002: TomarComanda
 * OP-003: AnularLineaComanda
 * OP-005: DividirCuenta
 */
@Injectable()
export class ComandaService {
  private readonly logger = new Logger(ComandaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * SK-002: tomar_comanda
   * PRE: servicio activo, ≥1 producto activo
   * POST: comanda creada, líneas con precio/IVA/modificadores, enviada a cocina/barra
   * ERROR: sin servicio→rechazar
   */
  async tomarComanda(params: {
    servicioId: string;
    lineas: Array<{
      productoId: string;
      cantidad: number;
      modificadores?: string[];
    }>;
  }) {
    const { servicioId, lineas } = params;

    if (lineas.length === 0) {
      throw new BadRequestException('OP-002 ERROR: La comanda debe tener al menos 1 línea.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // PRE: servicio activo
      const servicio = await tx.servicio.findUniqueOrThrow({
        where: { id: servicioId },
      });
      if (!servicio.abierto) {
        throw new BadRequestException('OP-002 ERROR: El servicio no está activo.');
      }

      // Contar comandas previas para número secuencial
      const countComandasPrevias = await tx.comanda.count({
        where: { servicioId },
      });

      // Obtener productos
      const productoIds = lineas.map((l) => l.productoId);
      const productos = await tx.producto.findMany({
        where: { id: { in: productoIds }, activo: true },
        include: { categoria: true, alergenos: { include: { alergeno: true } } },
      });

      const productosMap = new Map(productos.map((p) => [p.id, p]));

      // Verificar todos los productos existen
      for (const linea of lineas) {
        if (!productosMap.has(linea.productoId)) {
          throw new BadRequestException(
            `OP-002 ERROR: Producto ${linea.productoId} no encontrado o inactivo.`,
          );
        }
      }

      // Determinar destino comanda (POL-010)
      const destinos = new Set(productos.map((p) => p.categoria.destino).filter(Boolean));
      let destino: string | null = null;
      if (destinos.has('COCINA') && destinos.has('BARRA')) destino = 'AMBOS';
      else if (destinos.has('COCINA')) destino = 'COCINA';
      else if (destinos.has('BARRA')) destino = 'BARRA';

      // Mapear tipoIva enum a valor decimal
      const tipoIvaMap: Record<string, number> = {
        general_21: TIPOS_IVA.GENERAL_21,
        reducido_10: TIPOS_IVA.REDUCIDO_10,
        superreducido_4: TIPOS_IVA.SUPERREDUCIDO_4,
        exento_0: TIPOS_IVA.EXENTO_0,
      };

      // Crear comanda con líneas
      const comanda = await tx.comanda.create({
        data: {
          servicioId,
          numero: countComandasPrevias + 1,
          destino,
          lineas: {
            create: lineas.map((l) => {
              const producto = productosMap.get(l.productoId)!;
              const precio = decimalToNumber(producto.precioConIva);
              const tipoIva = tipoIvaMap[producto.tipoIva] ?? TIPOS_IVA.GENERAL_21;
              const baseTotal = calcularBaseImponible(precio * l.cantidad, tipoIva);
              const cuotaTotal = calcularCuotaIva(baseTotal, tipoIva);

              return {
                productoId: l.productoId,
                cantidad: l.cantidad,
                precioUnitario: precio,
                tipoIva,
                baseImponible: baseTotal,
                cuotaIva: cuotaTotal,
                modificadores: l.modificadores
                  ? {
                      create: l.modificadores.map((texto) => ({
                        texto,
                        precioExtra: 0,
                      })),
                    }
                  : undefined,
              };
            }),
          },
        },
        include: {
          lineas: {
            include: {
              producto: { include: { alergenos: { include: { alergeno: true } } } },
              modificadores: true,
            },
          },
        },
      });

      // RN-070: Alertar alérgenos
      const alertasAlergenos = comanda.lineas
        .flatMap((l) =>
          l.producto.alergenos.map((pa) => ({
            producto: l.producto.nombre,
            alergeno: pa.alergeno.nombre,
          })),
        );

      this.logger.log(
        `SK-002 OK: Comanda #${comanda.numero} → ${comanda.lineas.length} líneas, destino=${destino}`,
      );

      // EVT-002: ComandaRegistrada
      this.eventEmitter.emit(
        ComandaRegistradaEvent.event,
        new ComandaRegistradaEvent(
          comanda.id,
          servicioId,
          comanda.lineas.map((l) => ({
            productoId: l.productoId,
            cantidad: l.cantidad,
            precioUnitario: decimalToNumber(l.precioUnitario),
            tipoIva: decimalToNumber(l.tipoIva),
          })),
        ),
      );

      return {
        idComanda: comanda.id,
        numero: comanda.numero,
        destino,
        lineas: comanda.lineas,
        alertasAlergenos,
      };
    });
  }

  /**
   * SK-003: calcular_cuenta
   * Calcula el total y desglose IVA de todas las comandas de un servicio
   */
  async calcularCuenta(servicioId: string) {
    const lineas = await this.prisma.lineaComanda.findMany({
      where: {
        comanda: { servicioId },
        anulada: false,
      },
      include: { producto: true },
    });

    let base4 = 0, iva4 = 0;
    let base10 = 0, iva10 = 0;
    let base21 = 0, iva21 = 0;

    for (const linea of lineas) {
      const base = decimalToNumber(linea.baseImponible);
      const cuota = decimalToNumber(linea.cuotaIva);
      const tipoIva = decimalToNumber(linea.tipoIva);

      if (tipoIva === TIPOS_IVA.SUPERREDUCIDO_4) {
        base4 += base; iva4 += cuota;
      } else if (tipoIva === TIPOS_IVA.REDUCIDO_10) {
        base10 += base; iva10 += cuota;
      } else {
        base21 += base; iva21 += cuota;
      }
    }

    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
    const totalSinIva = round2(base4 + base10 + base21);
    const totalIva = round2(iva4 + iva10 + iva21);
    const total = round2(totalSinIva + totalIva);

    // INV-002: total = Σ(base + cuota)
    return {
      servicioId,
      lineas: lineas.map((l) => ({
        id: l.id,
        productoNombre: l.producto.nombre,
        cantidad: l.cantidad,
        precioUnitario: decimalToNumber(l.precioUnitario),
        subtotal: round2(decimalToNumber(l.baseImponible) + decimalToNumber(l.cuotaIva)),
      })),
      desglose: {
        base4: round2(base4), iva4: round2(iva4),
        base10: round2(base10), iva10: round2(iva10),
        base21: round2(base21), iva21: round2(iva21),
      },
      totalSinIva,
      totalIva,
      total,
    };
  }

  /**
   * SK-004: dividir_cuenta
   * PRE: servicio activo, cuenta>0, método indicado
   * POST: N subcuentas, Σ=total (INV-013), cada una con IVA correcto
   *
   * Métodos: "partes_iguales" | "por_productos" | "personalizado"
   */
  async dividirCuenta(params: {
    servicioId: string;
    metodo: 'partes_iguales' | 'por_productos';
    config: {
      numPartes?: number; // para partes_iguales
      grupos?: Array<{ lineasIds: string[] }>; // para por_productos
    };
  }) {
    const cuenta = await this.calcularCuenta(params.servicioId);
    if (cuenta.total <= 0) {
      throw new BadRequestException('OP-005 ERROR: La cuenta debe ser mayor que 0.');
    }

    if (params.metodo === 'partes_iguales') {
      const n = params.config.numPartes ?? 2;
      if (n < 2) throw new BadRequestException('Mínimo 2 partes.');

      // POL-012: N-1 primeros truncados a 2 decimales, último = resto
      const round2 = (v: number) => Math.floor(v * 100) / 100;
      const parte = round2(cuenta.total / n);
      const subcuentas = Array.from({ length: n }, (_, i) => ({
        numero: i + 1,
        total: i < n - 1
          ? parte
          : Math.round((cuenta.total - parte * (n - 1)) * 100) / 100,
      }));

      // INV-013: verificar
      const suma = subcuentas.reduce((s, sc) => s + sc.total, 0);
      const sumaRedondeada = Math.round(suma * 100) / 100;
      if (sumaRedondeada !== cuenta.total) {
        throw new BadRequestException(
          `INV-013 VIOLADA: Σ partes (${sumaRedondeada}) ≠ total (${cuenta.total})`,
        );
      }

      return { metodo: 'partes_iguales', subcuentas, totalOriginal: cuenta.total };
    }

    if (params.metodo === 'por_productos') {
      const grupos = params.config.grupos;
      if (!grupos || grupos.length < 2) {
        throw new BadRequestException('Mínimo 2 grupos para dividir por productos.');
      }

      const todasLineas = await this.prisma.lineaComanda.findMany({
        where: { comanda: { servicioId: params.servicioId }, anulada: false },
      });

      const subcuentas = grupos.map((grupo, idx) => {
        const lineasGrupo = todasLineas.filter((l) => grupo.lineasIds.includes(l.id));
        const totalGrupo = lineasGrupo.reduce(
          (sum, l) => sum + decimalToNumber(l.baseImponible) + decimalToNumber(l.cuotaIva),
          0,
        );
        return {
          numero: idx + 1,
          lineasIds: grupo.lineasIds,
          total: Math.round(totalGrupo * 100) / 100,
        };
      });

      // INV-013
      const suma = Math.round(subcuentas.reduce((s, sc) => s + sc.total, 0) * 100) / 100;
      if (suma !== cuenta.total) {
        throw new BadRequestException(
          `INV-013 VIOLADA: Σ subcuentas (${suma}) ≠ total (${cuenta.total}). Verifica que todas las líneas estén asignadas.`,
        );
      }

      return { metodo: 'por_productos', subcuentas, totalOriginal: cuenta.total };
    }

    throw new BadRequestException('Método de división no soportado.');
  }

  /**
   * OP-003: AnularLineaComanda
   * POL-011: Lógica de autorización por estado
   */
  async anularLinea(params: {
    lineaId: string;
    motivo: string;
    autorizacionEncargado?: string;
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const linea = await tx.lineaComanda.findUniqueOrThrow({
        where: { id: params.lineaId },
        include: { comanda: true },
      });

      if (linea.anulada) {
        throw new BadRequestException('Línea ya está anulada.');
      }

      // POL-011: verificar autorización según estado
      const estado = linea.comanda.estado;
      if (estado === 'en_preparacion' || estado === 'lista') {
        if (!params.autorizacionEncargado) {
          throw new BadRequestException(
            'POL-011: Se requiere clave de encargado para anular líneas en preparación/listas.',
          );
        }
      }

      await tx.lineaComanda.update({
        where: { id: params.lineaId },
        data: { anulada: true, motivoAnulacion: params.motivo },
      });

      // EVT-007
      this.eventEmitter.emit(
        LineaComandaAnuladaEvent.event,
        new LineaComandaAnuladaEvent(
          params.lineaId,
          params.motivo,
          params.autorizacionEncargado ?? null,
        ),
      );

      return { anulada: true };
    });
  }
}
