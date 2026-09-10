import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../../common/prisma/prisma.service';

@ApiTags('Catálogo')
@Controller('productos')
export class ProductoController {
  constructor(private readonly prisma: PrismaService) {}

  /** Catálogo completo: categorías + productos activos */
  @Get('catalogo')
  @ApiOperation({
    summary: 'Catálogo de TPV: categorías y productos activos',
    description:
      'Devuelve la lista optimizada de categorías y productos activos para renderizar la pantalla TPV. ' +
      'Solo incluye los campos necesarios para el TPV (id, nombre, precio, IVA, categoriaId). ' +
      'Los productos inactivos se excluyen automáticamente.',
  })
  @ApiOkResponse({
    description: 'Categorías ordenadas + productos activos',
    schema: {
      type: 'object',
      properties: {
        categorias: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              nombre: { type: 'string', example: 'Bebidas' },
              orden: { type: 'integer', example: 1 },
            },
          },
        },
        productos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              nombre: { type: 'string', example: 'Cerveza Estrella' },
              precioConIva: { type: 'number', example: 2.80 },
              tipoIva: { type: 'string', example: 'reducido_10' },
              categoriaId: { type: 'string', format: 'uuid' },
            },
          },
        },
      },
    },
  })
  async catalogo() {
    const [categorias, productos] = await Promise.all([
      this.prisma.categoriaProducto.findMany({
        where: { activa: true },
        select: { id: true, nombre: true, orden: true },
        orderBy: { orden: 'asc' },
      }),
      this.prisma.producto.findMany({
        where: { activo: true },
        select: {
          id: true,
          nombre: true,
          precioConIva: true,
          tipoIva: true,
          categoriaId: true,
        },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    return { categorias, productos };
  }
}
