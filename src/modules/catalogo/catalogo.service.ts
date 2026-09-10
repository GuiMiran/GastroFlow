import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { round2, decimalToNumber } from '../../common/types/iva';

/**
 * HU-M2-CAT-001: Alta de productos en carta
 * HU-M2-CAT-002: Escandallo / ficha técnica
 * HU-M2-CAT-003: Alérgenos de productos
 *
 * SK-020: calcular_escandallo
 * RN-020: food_cost = (coste_teorico / PVP_sin_IVA) × 100
 * RN-022: cantidad_bruta = cantidad_neta / (1 – %merma)
 */
@Injectable()
export class CatalogoService {
  private readonly logger = new Logger(CatalogoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── HU-M2-CAT-001: Productos ───

  async crearProducto(params: {
    establecimientoId: string;
    nombre: string;
    descripcion?: string;
    precioConIva: number;
    tipoIva: 'general_21' | 'reducido_10' | 'superreducido_4' | 'exento_0';
    categoriaId: string;
  }) {
    const producto = await this.prisma.producto.create({
      data: {
        establecimientoId: params.establecimientoId,
        nombre: params.nombre,
        descripcion: params.descripcion,
        precioConIva: params.precioConIva,
        tipoIva: params.tipoIva,
        categoriaId: params.categoriaId,
        activo: true,
      },
    });

    this.logger.log(`CAT-001 OK: Producto "${params.nombre}" creado → ${producto.id}`);
    return producto;
  }

  async actualizarProducto(
    productoId: string,
    data: {
      nombre?: string;
      descripcion?: string;
      precioConIva?: number;
      tipoIva?: 'general_21' | 'reducido_10' | 'superreducido_4' | 'exento_0';
      categoriaId?: string;
      activo?: boolean;
    },
  ) {
    const producto = await this.prisma.producto.update({
      where: { id: productoId },
      data,
    });

    // Si cambió el precio, recalcular food cost del escandallo si existe
    if (data.precioConIva !== undefined) {
      const escandallo = await this.prisma.escandallo.findUnique({
        where: { productoId },
      });
      if (escandallo) {
        await this.recalcularFoodCost(productoId);
      }
    }

    return producto;
  }

  async obtenerProducto(productoId: string) {
    return this.prisma.producto.findUniqueOrThrow({
      where: { id: productoId },
      include: {
        categoria: true,
        escandallo: {
          include: { ingredientes: { include: { ingrediente: true } } },
        },
        alergenos: { include: { alergeno: true } },
      },
    });
  }

  async listarProductos(establecimientoId: string) {
    return this.prisma.producto.findMany({
      where: { establecimientoId, activo: true },
      include: {
        categoria: true,
        alergenos: { include: { alergeno: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // ─── HU-M2-CAT-002: Escandallo / Ficha técnica ───

  /**
   * SK-020: Crear/actualizar escandallo de un producto
   * RN-020: food_cost = (coste_teorico / PVP_sin_IVA) × 100
   * RN-022: cantidad_bruta = cantidad_neta / (1 – %merma)
   */
  async crearEscandallo(params: {
    productoId: string;
    ingredientes: Array<{
      ingredienteId: string;
      cantidadNeta: number;
      merma?: number; // % merma (0-100)
    }>;
  }) {
    const { productoId, ingredientes } = params;

    if (ingredientes.length === 0) {
      throw new BadRequestException('El escandallo debe tener al menos 1 ingrediente.');
    }

    // Verificar producto existe
    const producto = await this.prisma.producto.findUniqueOrThrow({
      where: { id: productoId },
    });

    // Obtener ingredientes para calcular coste
    const ingredienteIds = ingredientes.map((i) => i.ingredienteId);
    const ingredientesDb = await this.prisma.ingrediente.findMany({
      where: { id: { in: ingredienteIds } },
    });
    const ingredientesMap = new Map(ingredientesDb.map((i) => [i.id, i]));

    // Calcular coste teórico
    let costeTeorico = 0;
    for (const ing of ingredientes) {
      const ingredienteDb = ingredientesMap.get(ing.ingredienteId);
      if (!ingredienteDb) {
        throw new BadRequestException(`Ingrediente ${ing.ingredienteId} no encontrado.`);
      }
      // RN-022: cantidad_bruta = cantidad_neta / (1 – %merma/100)
      const mermaDecimal = (ing.merma ?? 0) / 100;
      const cantidadBruta = mermaDecimal < 1 ? ing.cantidadNeta / (1 - mermaDecimal) : ing.cantidadNeta;
      costeTeorico += cantidadBruta * Number(ingredienteDb.precioCoste);
    }
    costeTeorico = round2(costeTeorico);

    // RN-020: food_cost = (coste / PVP_sin_IVA) × 100
    const tipoIvaMap: Record<string, number> = {
      general_21: 0.21,
      reducido_10: 0.10,
      superreducido_4: 0.04,
      exento_0: 0,
    };
    const tipoIva = tipoIvaMap[producto.tipoIva] ?? 0.21;
    const pvpSinIva = round2(Number(producto.precioConIva) / (1 + tipoIva));
    const foodCost = pvpSinIva > 0 ? round2((costeTeorico / pvpSinIva) * 100) : 0;

    // Upsert escandallo
    const escandallo = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete existing if any
      await tx.escandalloIngrediente.deleteMany({
        where: { escandallo: { productoId } },
      });
      await tx.escandallo.deleteMany({ where: { productoId } });

      return tx.escandallo.create({
        data: {
          productoId,
          costeTeorico,
          foodCost,
          ingredientes: {
            create: ingredientes.map((ing) => ({
              ingredienteId: ing.ingredienteId,
              cantidadNeta: ing.cantidadNeta,
              merma: ing.merma ?? 0,
            })),
          },
        },
        include: { ingredientes: { include: { ingrediente: true } } },
      });
    });

    this.logger.log(
      `CAT-002 OK: Escandallo producto ${productoId}: coste=${costeTeorico}€, food_cost=${foodCost}%`,
    );

    return { ...escandallo, costeTeorico, foodCost };
  }

  /**
   * Recalcular food cost cuando cambia precio del producto o coste de ingredientes
   */
  async recalcularFoodCost(productoId: string) {
    const producto = await this.prisma.producto.findUniqueOrThrow({
      where: { id: productoId },
    });

    const escandallo = await this.prisma.escandallo.findUnique({
      where: { productoId },
      include: { ingredientes: { include: { ingrediente: true } } },
    });

    if (!escandallo) return null;

    let costeTeorico = 0;
    for (const ei of escandallo.ingredientes) {
      const mermaDecimal = Number(ei.merma) / 100;
      const cantidadBruta =
        mermaDecimal < 1 ? Number(ei.cantidadNeta) / (1 - mermaDecimal) : Number(ei.cantidadNeta);
      costeTeorico += cantidadBruta * Number(ei.ingrediente.precioCoste);
    }
    costeTeorico = round2(costeTeorico);

    const tipoIvaMap: Record<string, number> = {
      general_21: 0.21,
      reducido_10: 0.10,
      superreducido_4: 0.04,
      exento_0: 0,
    };
    const tipoIva = tipoIvaMap[producto.tipoIva] ?? 0.21;
    const pvpSinIva = round2(Number(producto.precioConIva) / (1 + tipoIva));
    const foodCost = pvpSinIva > 0 ? round2((costeTeorico / pvpSinIva) * 100) : 0;

    await this.prisma.escandallo.update({
      where: { productoId },
      data: { costeTeorico, foodCost },
    });

    return { costeTeorico, foodCost };
  }

  // ─── HU-M2-CAT-003: Alérgenos ───

  async asignarAlergenos(productoId: string, alergenoIds: string[]) {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Remove existing
      await tx.productoAlergeno.deleteMany({ where: { productoId } });

      // Add new
      if (alergenoIds.length > 0) {
        await tx.productoAlergeno.createMany({
          data: alergenoIds.map((alergenoId) => ({
            productoId,
            alergenoId,
          })),
        });
      }
    });

    return this.prisma.producto.findUniqueOrThrow({
      where: { id: productoId },
      include: { alergenos: { include: { alergeno: true } } },
    });
  }

  async listarAlergenos() {
    return this.prisma.alergeno.findMany({ orderBy: { nombre: 'asc' } });
  }

  // ─── Categorías ───

  async crearCategoria(params: {
    nombre: string;
    destino?: string;
    orden?: number;
  }) {
    return this.prisma.categoriaProducto.create({
      data: {
        nombre: params.nombre,
        destino: params.destino ?? null,
        orden: params.orden ?? 0,
      },
    });
  }

  async listarCategorias() {
    return this.prisma.categoriaProducto.findMany({
      where: { activa: true },
      orderBy: { orden: 'asc' },
    });
  }

  // ─── Ingredientes CRUD ───

  async crearIngrediente(params: {
    nombre: string;
    unidadMedida: string;
    precioCoste: number;
    stockMinimo?: number;
  }) {
    return this.prisma.ingrediente.create({
      data: {
        nombre: params.nombre,
        unidadMedida: params.unidadMedida,
        precioCoste: params.precioCoste,
        stockMinimo: params.stockMinimo ?? 0,
      },
    });
  }

  async listarIngredientes() {
    return this.prisma.ingrediente.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }
}
