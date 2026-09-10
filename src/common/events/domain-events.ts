// Eventos de dominio — Capa 07 del SPEC
// Hechos pasados e inmutables que disparan reacciones en cadena

// ─── Sala / TPV ───

/** EVT-001 */
export class MesaAbiertaEvent {
  static readonly event = 'mesa.abierta';
  constructor(
    public readonly idMesa: string,
    public readonly idServicio: string,
    public readonly camareroId: string,
    public readonly hora: Date,
  ) {}
}

/** EVT-002 */
export class ComandaRegistradaEvent {
  static readonly event = 'comanda.registrada';
  constructor(
    public readonly idComanda: string,
    public readonly idServicio: string,
    public readonly lineas: Array<{
      productoId: string;
      cantidad: number;
      precioUnitario: number;
      tipoIva: number;
    }>,
  ) {}
}

/** EVT-003 */
export class PlatoListoEvent {
  static readonly event = 'plato.listo';
  constructor(
    public readonly idLinea: string,
    public readonly idMesa: string,
    public readonly hora: Date,
  ) {}
}

/** EVT-004 */
export class TicketEmitidoEvent {
  static readonly event = 'ticket.emitido';
  constructor(
    public readonly idTicket: string,
    public readonly numero: number,
    public readonly serie: string,
    public readonly total: number,
    public readonly desglose: {
      base4: number; iva4: number;
      base10: number; iva10: number;
      base21: number; iva21: number;
    },
    public readonly formasPago: Array<{ forma: string; importe: number }>,
    public readonly hashVerifactu: string,
    public readonly servicioId: string,
    public readonly clienteId: string | null,
  ) {}
}

/** EVT-005 */
export class FacturaCompletaEmitidaEvent {
  static readonly event = 'factura.completa.emitida';
  constructor(
    public readonly idFactura: string,
    public readonly destinatarioNif: string,
    public readonly total: number,
  ) {}
}

/** EVT-006 */
export class FacturaRectificativaEmitidaEvent {
  static readonly event = 'factura.rectificativa.emitida';
  constructor(
    public readonly idRectificativa: string,
    public readonly idOriginal: string,
    public readonly motivo: string,
    public readonly importe: number,
  ) {}
}

/** EVT-007 */
export class LineaComandaAnuladaEvent {
  static readonly event = 'linea.comanda.anulada';
  constructor(
    public readonly idLinea: string,
    public readonly motivo: string,
    public readonly autorizacion: string | null,
  ) {}
}

// ─── Caja ───

/** EVT-010 */
export class TurnoCajaAbiertoEvent {
  static readonly event = 'turno.caja.abierto';
  constructor(
    public readonly idTurno: string,
    public readonly cajaId: string,
    public readonly cajeroId: string,
    public readonly fondo: number,
  ) {}
}

/** EVT-011 */
export class TurnoCajaCerradoEvent {
  static readonly event = 'turno.caja.cerrado';
  constructor(
    public readonly idTurno: string,
    public readonly idCaja: string,
    public readonly esperado: number,
    public readonly real: number,
    public readonly descuadre: number,
  ) {}
}

/** EVT-012 */
export class ArqueoCajaRealizadoEvent {
  static readonly event = 'arqueo.caja.realizado';
  constructor(
    public readonly turnoCajaId: string,
    public readonly esperado: number,
    public readonly contado: number,
    public readonly diferencia: number,
  ) {}
}

/** EVT-013 */
export class MovimientoCajaRegistradoEvent {
  static readonly event = 'movimiento.caja.registrado';
  constructor(
    public readonly turnoCajaId: string,
    public readonly tipo: string,
    public readonly importe: number,
    public readonly concepto: string,
  ) {}
}

// ─── Inventario / Compras ───

/** EVT-020 */
export class StockBajoMinimoEvent {
  static readonly event = 'stock.bajo.minimo';
  constructor(
    public readonly ingredienteId: string,
    public readonly actual: number,
    public readonly minimo: number,
  ) {}
}

/** EVT-021 */
export class StockNegativoEvent {
  static readonly event = 'stock.negativo';
  constructor(
    public readonly ingredienteId: string,
    public readonly actual: number,
  ) {}
}

/** EVT-022 */
export class AlbaranRecibidoEvent {
  static readonly event = 'albaran.recibido';
  constructor(
    public readonly albaranId: string,
    public readonly proveedorId: string,
  ) {}
}

/** EVT-023 */
export class FacturaCompraRegistradaEvent {
  static readonly event = 'factura.compra.registrada';
  constructor(
    public readonly facturaId: string,
    public readonly proveedorId: string,
    public readonly totalIva: number,
  ) {}
}

/** EVT-024 */
export class InventarioFisicoRealizadoEvent {
  static readonly event = 'inventario.fisico.realizado';
  constructor(
    public readonly almacenId: string,
    public readonly desviaciones: Array<{ ingredienteId: string; diferencia: number }>,
  ) {}
}

// ─── Contable / Fiscal ───

/** EVT-030 */
export class AsientoContableCreado {
  static readonly event = 'asiento.contable.creado';
  constructor(
    public readonly idAsiento: string,
    public readonly origen: string,
  ) {}
}

/** EVT-031 */
export class TrimestreFiscalProximoACerrarEvent {
  static readonly event = 'trimestre.fiscal.proximo';
  constructor(
    public readonly trimestre: number,
    public readonly year: number,
    public readonly vencimiento: Date,
  ) {}
}

/** EVT-032 */
export class Modelo303GeneradoEvent {
  static readonly event = 'modelo303.generado';
  constructor(
    public readonly trimestre: number,
    public readonly resultado: number,
  ) {}
}

// ─── RRHH ───

/** EVT-040 */
export class EmpleadoFichoEvent {
  static readonly event = 'empleado.ficho';
  constructor(
    public readonly empleadoId: string,
    public readonly tipo: 'entrada' | 'salida',
    public readonly hora: Date,
  ) {}
}

/** EVT-041 */
export class ConflictoTurnoDetectadoEvent {
  static readonly event = 'conflicto.turno.detectado';
  constructor(
    public readonly empleadoId: string,
    public readonly motivo: string,
  ) {}
}

// ─── CRM ───

/** EVT-050 */
export class ClienteRegistradoEvent {
  static readonly event = 'cliente.registrado';
  constructor(
    public readonly clienteId: string,
    public readonly email: string | null,
    public readonly consentimiento: boolean,
  ) {}
}

/** EVT-051 */
export class PuntosAcumuladosEvent {
  static readonly event = 'puntos.acumulados';
  constructor(
    public readonly clienteId: string,
    public readonly puntosNuevos: number,
    public readonly saldo: number,
  ) {}
}

/** EVT-052 */
export class ReservaCreadaEvent {
  static readonly event = 'reserva.creada';
  constructor(
    public readonly reservaId: string,
    public readonly fecha: Date,
    public readonly comensales: number,
  ) {}
}

/** EVT-053 */
export class ReservaCanceladaEvent {
  static readonly event = 'reserva.cancelada';
  constructor(
    public readonly reservaId: string,
    public readonly motivo: string,
  ) {}
}

/** EVT-054 */
export class NoShowDetectadoEvent {
  static readonly event = 'noshow.detectado';
  constructor(
    public readonly reservaId: string,
    public readonly clienteId: string | null,
  ) {}
}
