/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GASTROFLOW — Swagger Response Schemas  (common/swagger/swagger-schemas.ts)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Clases de respuesta tipadas para @ApiResponse, @ApiBody y @ApiProperty.
 * Centralizar aquí TODOS los shapes de respuesta garantiza coherencia entre
 * la documentación generada y el contrato real de la API.
 *
 * USO PARA LA IA AGÉNTICA:
 * ─────────────────────────
 * Cada evolutivo que añada / modifique un endpoint DEBE:
 *   1. Declarar su DTO de respuesta aquí si es reutilizable.
 *   2. Referenciar la clase en @ApiOkResponse({ type: XxxResponse }).
 *   3. Verificar que el schema continúa siendo coherente con las invariantes
 *      definidas en specs/04-invariantes/ (ver INV-API-001 en ese directorio).
 *
 * REFERENCIA DE ESPECIFICACIÓN: specs/12-documentacion/api-contract.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Respuestas genéricas ────────────────────────────────────────────────────

export class ErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Validation failed' })
  message!: string | string[];

  @ApiPropertyOptional({ example: 'Bad Request' })
  error?: string;
}

export class PaginatedMeta {
  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}

// ─── M0-PLATFORM: Auth ──────────────────────────────────────────────────────

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT Bearer token. Incluir en cabecera: Authorization: Bearer <token>',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Rol del empleado autenticado',
    enum: ['ADMIN', 'GERENTE', 'CAMARERO', 'COCINERO', 'BARMAN', 'CAJERO'],
    example: 'CAMARERO',
  })
  rol!: string;

  @ApiProperty({ description: 'UUID del empleado', example: 'a1b2c3d4-…' })
  empleadoId!: string;

  @ApiProperty({ description: 'UUID del establecimiento', example: 'e1f2g3h4-…' })
  establecimientoId!: string;
}

// ─── M0-PLATFORM: Empleados ─────────────────────────────────────────────────

export class EmpleadoResponse {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'María García' })
  nombre!: string;

  @ApiProperty({ example: 'García Pérez' })
  apellidos!: string;

  @ApiProperty({ example: '12345678A' })
  nif!: string;

  @ApiProperty({
    enum: ['ADMIN', 'GERENTE', 'CAMARERO', 'COCINERO', 'BARMAN', 'CAJERO'],
    example: 'CAMARERO',
  })
  rol!: string;

  @ApiProperty({ example: 'Camarero/a' })
  puesto!: string;

  @ApiProperty({ example: true })
  activo!: boolean;
}

// ─── M1-TPV: Mesas ──────────────────────────────────────────────────────────

export class MesaResumen {
  @ApiProperty({ example: 'mesa-uuid' })
  id!: string;

  @ApiProperty({ example: 'Mesa 7' })
  nombre!: string;

  @ApiProperty({
    enum: ['libre', 'ocupada', 'reservada'],
    description: 'Estado operativo de la mesa (INV-010)',
    example: 'ocupada',
  })
  estado!: string;

  @ApiPropertyOptional({ example: 4, description: 'Número de comensales actual' })
  comensales?: number;

  @ApiPropertyOptional({ example: 'servicio-uuid', description: 'UUID del servicio activo' })
  servicioActivoId?: string;
}

export class MapaSalaResponse {
  @ApiProperty({ type: [MesaResumen] })
  mesas!: MesaResumen[];
}

export class ServicioAbierto {
  @ApiProperty({ example: 'servicio-uuid' })
  id!: string;

  @ApiProperty({ example: '2026-03-15T12:30:00.000Z' })
  horaApertura!: string;

  @ApiProperty({ example: 'mesa-uuid' })
  mesaId!: string;
}

// ─── M1-TPV: Comandas ───────────────────────────────────────────────────────

export class LineaComandaResponse {
  @ApiProperty({ example: 'linea-uuid' })
  id!: string;

  @ApiProperty({ example: 'Cerveza Estrella' })
  productoNombre!: string;

  @ApiProperty({ example: 2 })
  cantidad!: number;

  @ApiProperty({ example: 2.80 })
  precioUnitario!: number;

  @ApiProperty({
    enum: ['pendiente', 'en_preparacion', 'listo', 'entregado', 'anulado'],
    example: 'pendiente',
  })
  estado!: string;

  @ApiPropertyOptional({ example: ['Sin cebolla', 'Punto medio'] })
  modificadores?: string[];

  @ApiPropertyOptional({ example: 'Sin sal' })
  notas?: string;
}

export class ComandaResponse {
  @ApiProperty({ example: 'comanda-uuid' })
  id!: string;

  @ApiProperty({ example: 'servicio-uuid' })
  servicioId!: string;

  @ApiProperty({ example: '2026-03-15T12:35:00.000Z' })
  creadaAt!: string;

  @ApiProperty({ type: [LineaComandaResponse] })
  lineas!: LineaComandaResponse[];
}

export class CuentaResponse {
  @ApiProperty({ example: 'servicio-uuid' })
  servicioId!: string;

  @ApiProperty({ example: 18.50, description: 'Base imponible total (sin IVA)' })
  baseImponible!: number;

  @ApiProperty({ example: 1.85, description: 'Cuota de IVA total' })
  totalIva!: number;

  @ApiProperty({ example: 20.35, description: 'Total con IVA (INV-002)' })
  total!: number;

  @ApiProperty({ type: [LineaComandaResponse] })
  lineas!: LineaComandaResponse[];
}

// ─── M1-TPV: Cobros y Tickets ────────────────────────────────────────────────

export class TicketLineaDto {
  @ApiProperty({ example: 'Tortilla española' })
  concepto!: string;

  @ApiProperty({ example: 1 })
  cantidad!: number;

  @ApiProperty({ example: 8.00, description: 'Precio con IVA por unidad' })
  precioConIva!: number;

  @ApiProperty({ example: 'reducido_10' })
  tipoIva!: string;

  @ApiProperty({ example: 7.27, description: 'Base imponible de línea' })
  baseLinea!: number;

  @ApiProperty({ example: 0.73, description: 'Cuota IVA de línea (INV-003)' })
  cuotaIvaLinea!: number;
}

export class TicketResponse {
  @ApiProperty({ example: 'ticket-uuid' })
  id!: string;

  @ApiProperty({ example: 'T-2026-00042' })
  numero!: string;

  @ApiProperty({ example: '2026-03-15T13:10:00.000Z' })
  emitidoAt!: string;

  @ApiProperty({ example: 20.35 })
  total!: number;

  @ApiProperty({ example: 18.50 })
  baseImponible!: number;

  @ApiProperty({ example: 1.85 })
  totalIva!: number;

  @ApiProperty({
    enum: ['emitido', 'cobrado', 'rectificado', 'anulado'],
    example: 'cobrado',
  })
  estado!: string;

  @ApiProperty({ type: [TicketLineaDto] })
  lineas!: TicketLineaDto[];

  @ApiPropertyOptional({ example: 'abc123…', description: 'Hash VeriFactu (INV-007, INV-008)' })
  hashVerifactu?: string;
}

export class CobroResponse {
  @ApiProperty({ example: 'ticket-uuid', description: 'ID del ticket generado' })
  ticketId!: string;

  @ApiProperty({ example: 20.35 })
  totalCobrado!: number;

  @ApiProperty({ example: 'T-2026-00042' })
  numeroTicket!: string;
}

// ─── M1-TPV: Caja ───────────────────────────────────────────────────────────

export class TurnoCajaResponse {
  @ApiProperty({ example: 'turno-uuid' })
  id!: string;

  @ApiProperty({ example: '2026-03-15T08:00:00.000Z' })
  apertura!: string;

  @ApiPropertyOptional({ example: '2026-03-15T16:00:00.000Z' })
  cierre?: string;

  @ApiProperty({ example: 200.00, description: 'Fondo de apertura en euros' })
  fondoApertura!: number;

  @ApiPropertyOptional({ example: 850.50, description: 'Efectivo contado al cierre (INV-015)' })
  contadoEfectivo?: number;

  @ApiPropertyOptional({ example: 0.00, description: 'Diferencia entre teórico y contado' })
  diferencia?: number;
}

// ─── M1-TPV: KDS ─────────────────────────────────────────────────────────────

export class LineaKdsResponse {
  @ApiProperty({ example: 'linea-uuid' })
  id!: string;

  @ApiProperty({ example: 'Entrecot al punto' })
  productoNombre!: string;

  @ApiProperty({ example: 1 })
  cantidad!: number;

  @ApiProperty({ example: 'Mesa 7' })
  mesa!: string;

  @ApiProperty({ example: '2026-03-15T13:05:00.000Z' })
  pedidoAt!: string;

  @ApiProperty({
    enum: ['pendiente', 'en_preparacion', 'listo'],
    example: 'pendiente',
  })
  estado!: string;

  @ApiPropertyOptional({ example: ['Sin cebolla'] })
  modificadores?: string[];
}

// ─── M2-ERP: Catálogo ───────────────────────────────────────────────────────

export class ProductoResponse {
  @ApiProperty({ example: 'producto-uuid' })
  id!: string;

  @ApiProperty({ example: 'Cerveza Estrella' })
  nombre!: string;

  @ApiProperty({ example: 2.80 })
  precioConIva!: number;

  @ApiProperty({
    enum: ['general_21', 'reducido_10', 'superreducido_4', 'exento_0'],
    example: 'reducido_10',
  })
  tipoIva!: string;

  @ApiProperty({ example: true })
  activo!: boolean;

  @ApiPropertyOptional({ example: 'categoria-uuid' })
  categoriaId?: string;
}

export class CategoriaResponse {
  @ApiProperty({ example: 'categoria-uuid' })
  id!: string;

  @ApiProperty({ example: 'Bebidas' })
  nombre!: string;

  @ApiProperty({ example: 2 })
  orden!: number;
}

export class IngredienteResponse {
  @ApiProperty({ example: 'ingrediente-uuid' })
  id!: string;

  @ApiProperty({ example: 'Lechuga romana' })
  nombre!: string;

  @ApiProperty({ example: 'kg' })
  unidadMedida!: string;

  @ApiProperty({ example: 1.20 })
  precioCoste!: number;

  @ApiPropertyOptional({ example: 2.0, description: 'Stock mínimo para alerta' })
  stockMinimo?: number;
}

// ─── M2-ERP: Inventario ─────────────────────────────────────────────────────

export class StockItemResponse {
  @ApiProperty({ example: 'ingrediente-uuid' })
  ingredienteId!: string;

  @ApiProperty({ example: 'Lechuga romana' })
  nombre!: string;

  @ApiProperty({ example: 5.50, description: 'Cantidad en unidades de medida del ingrediente' })
  cantidad!: number;

  @ApiProperty({ example: 'kg' })
  unidadMedida!: string;

  @ApiPropertyOptional({ example: 2.0 })
  stockMinimo?: number;

  @ApiProperty({ example: false, description: 'true si cantidad < stockMinimo (INV-020)' })
  alerta!: boolean;
}

export class AlmacenResponse {
  @ApiProperty({ example: 'almacen-uuid' })
  id!: string;

  @ApiProperty({ example: 'Almacén principal' })
  nombre!: string;

  @ApiPropertyOptional({ example: 'Cocina central' })
  descripcion?: string;
}

// ─── M2-ERP: Compras ────────────────────────────────────────────────────────

export class ProveedorResponse {
  @ApiProperty({ example: 'proveedor-uuid' })
  id!: string;

  @ApiProperty({ example: 'Distribuciones Rodríguez SL' })
  nombre!: string;

  @ApiProperty({ example: 'B12345678' })
  nif!: string;

  @ApiPropertyOptional({ example: '91 000 00 00' })
  telefono?: string;

  @ApiPropertyOptional({ example: 'pedidos@rodriguez.es' })
  email?: string;
}

export class PedidoResponse {
  @ApiProperty({ example: 'pedido-uuid' })
  id!: string;

  @ApiProperty({ example: 'proveedor-uuid' })
  proveedorId!: string;

  @ApiProperty({
    enum: ['pendiente', 'enviado', 'recibido', 'cancelado'],
    example: 'pendiente',
  })
  estado!: string;

  @ApiPropertyOptional({ example: '2026-03-20T00:00:00.000Z' })
  fechaEntrega?: string;
}

export class FacturaCompraResponse {
  @ApiProperty({ example: 'factura-uuid' })
  id!: string;

  @ApiProperty({ example: 'FV-2026-0123' })
  numeroFactura!: string;

  @ApiProperty({ example: '2026-03-15T00:00:00.000Z' })
  fechaFactura!: string;

  @ApiProperty({ example: 100.00, description: 'Suma de bases imponibles (INV-005)' })
  totalBase!: number;

  @ApiProperty({ example: 10.00, description: 'IVA soportado total (INV-005)' })
  totalIva!: number;

  @ApiProperty({ example: 110.00 })
  totalFactura!: number;

  @ApiPropertyOptional({ description: 'Proveedor relacionado' })
  proveedor?: { nombre: string; nif: string };

  @ApiPropertyOptional({ description: 'Asiento contable generado (INV-033)' })
  asientoContable?: { id: string; numero: number; concepto: string };
}

// ─── M2-ERP: RRHH ───────────────────────────────────────────────────────────

export class FichajeResponse {
  @ApiProperty({ example: 'fichaje-uuid' })
  id!: string;

  @ApiProperty({ example: 'empleado-uuid' })
  empleadoId!: string;

  @ApiProperty({ enum: ['entrada', 'salida'], example: 'entrada' })
  tipo!: string;

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z' })
  timestamp!: string;
}

export class TurnoRrhhResponse {
  @ApiProperty({ example: 'turno-uuid' })
  id!: string;

  @ApiProperty({ example: 'empleado-uuid' })
  empleadoId!: string;

  @ApiProperty({ example: '2026-03-15T00:00:00.000Z' })
  fecha!: string;

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z' })
  horaInicio!: string;

  @ApiProperty({ example: '2026-03-15T17:00:00.000Z' })
  horaFin!: string;
}

// ─── M3-CONTABILIDAD ────────────────────────────────────────────────────────

export class BalanceCuenta {
  @ApiProperty({ example: '7000', description: 'Código de cuenta PGC' })
  cuenta!: string;

  @ApiProperty({ example: 'Ventas de mercaderías' })
  descripcion!: string;

  @ApiProperty({ example: 1250.00 })
  debe!: number;

  @ApiProperty({ example: 0.00 })
  haber!: number;

  @ApiProperty({ example: 1250.00, description: 'debe - haber (INV-030)' })
  saldo!: number;
}

export class BalanceResponse {
  @ApiProperty({ type: [BalanceCuenta] })
  cuentas!: BalanceCuenta[];

  @ApiProperty({ example: 1250.00, description: 'Total saldos deudores' })
  totalDeudor!: number;

  @ApiProperty({ example: 1250.00, description: 'Total saldos acreedores (INV-031: debe = haber)' })
  totalAcreedor!: number;
}

export class AsientoLineaResponse {
  @ApiProperty({ example: '7000' })
  cuenta!: string;

  @ApiProperty({ example: 'Ventas de mercaderías' })
  descripcion!: string;

  @ApiProperty({ example: 100.00 })
  debe!: number;

  @ApiProperty({ example: 0.00 })
  haber!: number;
}

export class AsientoResponse {
  @ApiProperty({ example: 'asiento-uuid' })
  id!: string;

  @ApiProperty({ example: 42 })
  numero!: number;

  @ApiProperty({ example: '2026-03-15T00:00:00.000Z' })
  fecha!: string;

  @ApiProperty({ example: 'Venta ticket T-2026-00042' })
  concepto!: string;

  @ApiProperty({ type: [AsientoLineaResponse] })
  lineas!: AsientoLineaResponse[];
}

// ─── M3-FISCAL ──────────────────────────────────────────────────────────────

export class IvaDesglose {
  @ApiProperty({ example: 21, description: 'Tipo de IVA en %' })
  tipo!: number;

  @ApiProperty({ example: 500.00 })
  base!: number;

  @ApiProperty({ example: 105.00 })
  cuota!: number;
}

export class IvaTrimestralResponse {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 1 })
  trimestre!: number;

  @ApiProperty({ type: [IvaDesglose], description: 'IVA repercutido por tipo (INV-004)' })
  repercutido!: IvaDesglose[];

  @ApiProperty({ type: [IvaDesglose], description: 'IVA soportado deducible (INV-005)' })
  soportado!: IvaDesglose[];

  @ApiProperty({ example: 105.00, description: 'Total repercutido' })
  totalRepercutido!: number;

  @ApiProperty({ example: 20.00, description: 'Total soportado deducible' })
  totalSoportado!: number;

  @ApiProperty({ example: 85.00, description: 'Resultado del Modelo 303 (INV-006)' })
  resultadoModelo303!: number;
}

export class Modelo303Response {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 1 })
  trimestre!: number;

  @ApiProperty({ example: 500.00, description: 'Casilla 01: Base IVA 21%' })
  base21!: number;

  @ApiProperty({ example: 105.00, description: 'Casilla 03: Cuota IVA 21%' })
  cuota21!: number;

  @ApiProperty({ example: 200.00, description: 'Casilla 04: Base IVA 10%' })
  base10!: number;

  @ApiProperty({ example: 20.00, description: 'Casilla 06: Cuota IVA 10%' })
  cuota10!: number;

  @ApiProperty({ example: 125.00, description: 'Casilla 07: Base IVA 4%' })
  base4!: number;

  @ApiProperty({ example: 5.00, description: 'Casilla 09: Cuota IVA 4%' })
  cuota4!: number;

  @ApiProperty({ example: 130.00, description: 'Casilla 27: Total cuotas repercutidas' })
  totalRepercutido!: number;

  @ApiProperty({ example: 20.00, description: 'Casilla 29: Total deducible soportado' })
  totalDeducible!: number;

  @ApiProperty({ example: 110.00, description: 'Casilla 46: Resultado final (INV-006)' })
  resultado!: number;
}
