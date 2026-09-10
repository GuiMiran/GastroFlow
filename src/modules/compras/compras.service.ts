import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  AlbaranRecibidoEvent,
  FacturaCompraRegistradaEvent,
} from '../../common/events/domain-events';
import { round2 } from '../../common/types/iva';

/**
 * HU-M2-COM-001: Alta de proveedores
 * HU-M2-COM-002: Pedido a proveedor
 * HU-M2-COM-003: Recepción de mercancía (albarán)
 * HU-M2-COM-004: Facturas de proveedores
 *
 * SK-024: recepcion_albaran
 * SK-025: registrar_factura_proveedor
 * EVT-022: AlbaranRecibido
 * EVT-023: FacturaCompraRegistrada
 */
@Injectable()
export class ComprasService {
  private readonly logger = new Logger(ComprasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── HU-M2-COM-001: Proveedores ───

  async crearProveedor(params: {
    establecimientoId: string;
    nombre: string;
    nif: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  }) {
    const proveedor = await this.prisma.proveedor.create({
      data: {
        establecimientoId: params.establecimientoId,
        nombre: params.nombre,
        nif: params.nif,
        direccion: params.direccion,
        telefono: params.telefono,
        email: params.email,
      },
    });
    this.logger.log(`COM-001 OK: Proveedor "${params.nombre}" creado → ${proveedor.id}`);
    return proveedor;
  }

  async listarProveedores(establecimientoId: string) {
    return this.prisma.proveedor.findMany({
      where: { establecimientoId, activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async obtenerProveedor(proveedorId: string) {
    return this.prisma.proveedor.findUniqueOrThrow({
      where: { id: proveedorId },
      include: { pedidos: { take: 10, orderBy: { fechaPedido: 'desc' } } },
    });
  }

  // ─── HU-M2-COM-002: Pedidos a proveedor ───

  async crearPedido(params: {
    proveedorId: string;
    fechaEntrega?: Date;
    lineas: Array<{
      ingredienteId: string;
      descripcion: string;
      cantidadPedida: number;
      unidadMedida: string;
      precioEstimado?: number;
    }>;
  }) {
    if (params.lineas.length === 0) {
      throw new BadRequestException('El pedido debe tener al menos 1 línea.');
    }

    const pedido = await this.prisma.pedidoProveedor.create({
      data: {
        proveedorId: params.proveedorId,
        fechaEntrega: params.fechaEntrega,
        estado: 'pendiente',
        lineas: {
          create: params.lineas.map((l) => ({
            ingredienteId: l.ingredienteId,
            descripcion: l.descripcion,
            cantidadPedida: l.cantidadPedida,
            unidadMedida: l.unidadMedida,
            precioEstimado: l.precioEstimado,
          })),
        },
      },
      include: { lineas: true },
    });

    this.logger.log(`COM-002 OK: Pedido ${pedido.id} a proveedor ${params.proveedorId}`);
    return pedido;
  }

  async listarPedidos(proveedorId: string) {
    return this.prisma.pedidoProveedor.findMany({
      where: { proveedorId },
      include: { lineas: true },
      orderBy: { fechaPedido: 'desc' },
    });
  }

  async listarAlbaranes(proveedorId: string) {
    return this.prisma.albaranEntrada.findMany({
      where: { proveedorId },
      include: { lineas: true },
      orderBy: { fechaRecepcion: 'desc' },
    });
  }

  // ─── HU-M2-COM-003: Recepción mercancía (albarán) ───

  /**
   * SK-024: recepcion_albaran
   * AC-01: Contrasta con pedido original y marca diferencias
   * AC-02: Stock se actualiza automáticamente
   * EVT-022: AlbaranRecibido
   */
  async registrarAlbaran(params: {
    proveedorId: string;
    pedidoId?: string;
    numeroAlbaran: string;
    lineas: Array<{
      ingredienteId: string;
      cantidadRecibida: number;
      cantidadEsperada?: number;
    }>;
    almacenId: string;
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Crear albarán con líneas
      const albaran = await tx.albaranEntrada.create({
        data: {
          proveedorId: params.proveedorId,
          pedidoId: params.pedidoId,
          numeroAlbaran: params.numeroAlbaran,
          lineas: {
            create: params.lineas.map((l) => ({
              ingredienteId: l.ingredienteId,
              cantidadRecibida: l.cantidadRecibida,
              cantidadEsperada: l.cantidadEsperada,
              diferencia:
                l.cantidadEsperada != null
                  ? l.cantidadRecibida - l.cantidadEsperada
                  : null,
            })),
          },
        },
        include: { lineas: true },
      });

      // Actualizar stock para cada línea recibida
      for (const linea of params.lineas) {
        await tx.stock.upsert({
          where: {
            ingredienteId_almacenId: {
              ingredienteId: linea.ingredienteId,
              almacenId: params.almacenId,
            },
          },
          update: { cantidad: { increment: linea.cantidadRecibida } },
          create: {
            ingredienteId: linea.ingredienteId,
            almacenId: params.almacenId,
            cantidad: linea.cantidadRecibida,
          },
        });

        // Registrar movimiento de stock
        await tx.movimientoStock.create({
          data: {
            ingredienteId: linea.ingredienteId,
            tipo: 'entrada_compra',
            cantidad: linea.cantidadRecibida,
            origenDocumento: `albaran:${albaran.id}`,
          },
        });
      }

      // Actualizar estado pedido si aplica
      if (params.pedidoId) {
        await tx.pedidoProveedor.update({
          where: { id: params.pedidoId },
          data: { estado: 'recibido' },
        });
      }

      this.logger.log(`COM-003 OK: Albarán ${params.numeroAlbaran} registrado → ${albaran.id}`);

      // EVT-022: AlbaranRecibido
      this.eventEmitter.emit(
        AlbaranRecibidoEvent.event,
        new AlbaranRecibidoEvent(albaran.id, params.proveedorId),
      );

      return albaran;
    });
  }

  // ─── HU-M2-COM-004: Facturas de proveedores ───

  /**
   * SK-025: registrar_factura_proveedor
   * AC-01: Valida datos fiscales
   * AC-02: Genera asiento contable + IVA soportado (via EVT-023)
   */
  async registrarFacturaCompra(params: {
    proveedorId: string;
    numeroFactura: string;
    fechaFactura: Date;
    baseImponible4?: number;
    cuotaIva4?: number;
    baseImponible10?: number;
    cuotaIva10?: number;
    baseImponible21?: number;
    cuotaIva21?: number;
  }) {
    const base4 = params.baseImponible4 ?? 0;
    const iva4 = params.cuotaIva4 ?? 0;
    const base10 = params.baseImponible10 ?? 0;
    const iva10 = params.cuotaIva10 ?? 0;
    const base21 = params.baseImponible21 ?? 0;
    const iva21 = params.cuotaIva21 ?? 0;

    const totalSinIva = round2(base4 + base10 + base21);
    const totalIva = round2(iva4 + iva10 + iva21);
    const total = round2(totalSinIva + totalIva);

    const factura = await this.prisma.facturaCompra.create({
      data: {
        proveedorId: params.proveedorId,
        numeroFactura: params.numeroFactura,
        fechaFactura: params.fechaFactura,
        baseImponible4: base4,
        cuotaIva4: iva4,
        baseImponible10: base10,
        cuotaIva10: iva10,
        baseImponible21: base21,
        cuotaIva21: iva21,
        totalSinIva,
        totalIva,
        total,
      },
    });

    // Libro registro recibidas (INV-033)
    await this.prisma.libroRegistroRecibida.create({
      data: {
        facturaCompraId: factura.id,
        fechaRecepcion: new Date(),
        proveedorNif: (
          await this.prisma.proveedor.findUniqueOrThrow({
            where: { id: params.proveedorId },
            select: { nif: true },
          })
        ).nif,
        baseImponible: totalSinIva,
        cuotaIva: totalIva,
        total,
      },
    });

    this.logger.log(
      `COM-004 OK: Factura ${params.numeroFactura} registrada total=${total}€`,
    );

    // EVT-023: FacturaCompraRegistrada → trigger asiento contable
    this.eventEmitter.emit(
      FacturaCompraRegistradaEvent.event,
      new FacturaCompraRegistradaEvent(factura.id, params.proveedorId, totalIva),
    );

    return factura;
  }

  async listarFacturas(proveedorId: string) {
    return this.prisma.facturaCompra.findMany({
      where: { proveedorId },
      include: {
        proveedor: { select: { nombre: true, nif: true } },
        asientoContable: { select: { id: true, numero: true, concepto: true } },
        libroRegistroRecibida: { select: { fechaRecepcion: true } },
      },
      orderBy: { fechaFactura: 'desc' },
    });
  }
}
