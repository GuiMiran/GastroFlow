import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CatalogoService } from './catalogo.service';

@ApiTags('Catálogo')
@ApiBearerAuth('JWT')
/**
 * HU-M2-CAT-001: CRUD productos
 * HU-M2-CAT-002: Escandallos
 * HU-M2-CAT-003: Alérgenos
 */
@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  // ─── Productos ───

  @Post('productos')
  @ApiOperation({
    summary: 'Crear producto (HU-M2-CAT-001)',
    description:
      'Crea un nuevo producto en el catálogo del establecimiento. ' +
      'El tipo de IVA determina el escandallo fiscal y las cuotas en tickets. ' +
      'Los productos con alérgenos deben tener asignados mediante PATCH /alergenos.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['establecimientoId', 'nombre', 'precioConIva', 'tipoIva', 'categoriaId'],
      properties: {
        establecimientoId: { type: 'string', format: 'uuid' },
        nombre: { type: 'string', example: 'Croquetas de jamón (rac.)' },
        descripcion: { type: 'string', example: 'Croquetas caseras de jamón ibérico' },
        precioConIva: { type: 'number', minimum: 0.01, example: 9.50 },
        tipoIva: {
          type: 'string',
          enum: ['general_21', 'reducido_10', 'superreducido_4', 'exento_0'],
          example: 'reducido_10',
        },
        categoriaId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Producto creado con ID asignado' })
  crearProducto(
    @Body()
    body: {
      establecimientoId: string;
      nombre: string;
      descripcion?: string;
      precioConIva: number;
      tipoIva: 'general_21' | 'reducido_10' | 'superreducido_4' | 'exento_0';
      categoriaId: string;
    },
  ) {
    return this.catalogoService.crearProducto(body);
  }

  @Patch('productos/:id')
  @ApiOperation({
    summary: 'Actualizar producto',
    description:
      'Actualiza campos del producto. Todos los campos son opcionales. ' +
      'Para desactivar un producto (sin borrar), usar `activo: false`. ' +
      'El cambio de precio no afecta a tickets ya emitidos (inmutabilidad fiscal).',
  })
  @ApiParam({ name: 'id', description: 'UUID del producto', type: 'string' })
  @ApiOkResponse({ description: 'Producto actualizado' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  actualizarProducto(
    @Param('id') id: string,
    @Body()
    body: {
      nombre?: string;
      descripcion?: string;
      precioConIva?: number;
      tipoIva?: 'general_21' | 'reducido_10' | 'superreducido_4' | 'exento_0';
      categoriaId?: string;
      activo?: boolean;
    },
  ) {
    return this.catalogoService.actualizarProducto(id, body);
  }

  @Get('productos/:id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Datos completos del producto con alérgenos y escandallo' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  obtenerProducto(@Param('id') id: string) {
    return this.catalogoService.obtenerProducto(id);
  }

  @Get('productos')
  @ApiOperation({
    summary: 'Listar productos del establecimiento',
    description: 'Devuelve todos los productos (activos e inactivos). Para filtrar solo activos, usar GET /productos/catalogo.',
  })
  @ApiQuery({ name: 'establecimientoId', required: true, description: 'UUID del establecimiento' })
  @ApiOkResponse({ description: 'Array de productos con categoría y alérgenos' })
  listarProductos(@Query('establecimientoId') establecimientoId: string) {
    return this.catalogoService.listarProductos(establecimientoId);
  }

  // ─── Escandallos ───

  @Post('productos/:productoId/escandallo')
  @ApiOperation({
    summary: 'Crear/actualizar escandallo de un producto (HU-M2-CAT-002)',
    description:
      'Define los ingredientes y cantidades que componen una ración del producto. ' +
      'El escandallo permite calcular food cost (SK-016) y descontar stock automáticamente al cobrar (SK-010). ' +
      'La merma se expresa como porcentaje (0.10 = 10%).',
  })
  @ApiParam({ name: 'productoId', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ingredientes'],
      properties: {
        ingredientes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['ingredienteId', 'cantidadNeta'],
            properties: {
              ingredienteId: { type: 'string', format: 'uuid' },
              cantidadNeta: { type: 'number', minimum: 0.001, example: 0.200, description: 'Cantidad neta en la unidad del ingrediente (ej: kg)' },
              merma: { type: 'number', minimum: 0, maximum: 1, example: 0.05, description: 'Merma como porcentaje decimal (0.05 = 5%)' },
            },
          },
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Escandallo registrado; food cost recalculado' })
  crearEscandallo(
    @Param('productoId') productoId: string,
    @Body()
    body: {
      ingredientes: Array<{
        ingredienteId: string;
        cantidadNeta: number;
        merma?: number;
      }>;
    },
  ) {
    return this.catalogoService.crearEscandallo({
      productoId,
      ingredientes: body.ingredientes,
    });
  }

  // ─── Alérgenos ───

  @Get('alergenos')
  @ApiOperation({
    summary: 'Listar alérgenos del Reglamento 1169/2011',
    description:
      'Devuelve los 14 alérgenos de declaración obligatoria según el Reglamento EU 1169/2011. ' +
      'Son predefinidos en el sistema; no se pueden crear nuevos (RN-031).',
  })
  @ApiOkResponse({ description: 'Array de 14 alérgenos EU' })
  listarAlergenos() {
    return this.catalogoService.listarAlergenos();
  }

  @Patch('productos/:productoId/alergenos')
  @ApiOperation({
    summary: 'Asignar alérgenos a un producto (HU-M2-CAT-003)',
    description:
      'Reemplaza la lista completa de alérgenos del producto. ' +
      'Enviar array vacío elimina todos los alérgenos. ' +
      'En el TPV se muestra un icono de alerta si el producto tiene alérgenos (RN-031).',
  })
  @ApiParam({ name: 'productoId', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['alergenoIds'],
      properties: {
        alergenoIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          example: ['alergeno-uuid-gluten', 'alergeno-uuid-lacteos'],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Alérgenos actualizados' })
  asignarAlergenos(
    @Param('productoId') productoId: string,
    @Body() body: { alergenoIds: string[] },
  ) {
    return this.catalogoService.asignarAlergenos(productoId, body.alergenoIds);
  }

  // ─── Categorías ───

  @Post('categorias')
  @ApiOperation({
    summary: 'Crear categoría de producto',
    description: 'Crea una categoría para agrupar productos en el menú. El campo `destino` puede ser COCINA o BARRA para el enrutado KDS.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre'],
      properties: {
        nombre: { type: 'string', example: 'Bebidas' },
        destino: { type: 'string', enum: ['COCINA', 'BARRA'], example: 'BARRA' },
        orden: { type: 'integer', example: 1 },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Categoría creada' })
  crearCategoria(@Body() body: { nombre: string; destino?: string; orden?: number }) {
    return this.catalogoService.crearCategoria(body);
  }

  @Get('categorias')
  @ApiOperation({ summary: 'Listar categorías activas ordenadas' })
  @ApiOkResponse({ description: 'Array de categorías ordenadas por campo `orden`' })
  listarCategorias() {
    return this.catalogoService.listarCategorias();
  }

  // ─── Ingredientes ───

  @Post('ingredientes')
  @ApiOperation({
    summary: 'Crear ingrediente para escandallos e inventario',
    description:
      'El ingrediente es la unidad atómica de inventario. ' +
      'Una vez creado puede asignarse a escandallos y gestionarse en almacenes. ' +
      'El `stockMinimo` dispara alertas (INV-020).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre', 'unidadMedida', 'precioCoste'],
      properties: {
        nombre: { type: 'string', example: 'Tomate natural triturado' },
        unidadMedida: { type: 'string', example: 'kg', description: 'kg, l, ud, g, ml...' },
        precioCoste: { type: 'number', minimum: 0, example: 1.20, description: 'Precio por unidad de medida' },
        stockMinimo: { type: 'number', minimum: 0, example: 5.0, description: 'Umbral para alerta de stock bajo' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Ingrediente creado con ID asignado' })
  crearIngrediente(
    @Body()
    body: {
      nombre: string;
      unidadMedida: string;
      precioCoste: number;
      stockMinimo?: number;
    },
  ) {
    return this.catalogoService.crearIngrediente(body);
  }

  @Get('ingredientes')
  @ApiOperation({ summary: 'Listar todos los ingredientes' })
  @ApiOkResponse({ description: 'Array de ingredientes con stock mínimo y precio coste' })
  listarIngredientes() {
    return this.catalogoService.listarIngredientes();
  }
}
