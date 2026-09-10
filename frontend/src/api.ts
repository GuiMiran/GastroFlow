const BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

// ---------- MESAS ----------
export interface Zona {
  id: string;
  nombre: string;
  mesas: Mesa[];
}

export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'reservada' | 'pendiente_cobro';
  servicios?: Servicio[];
}

export interface Servicio {
  id: string;
  mesaId: string | null;
  camareroId: string;
  comensales: number;
  abierto: boolean;
}

// HU-M1-COB-008: Ticket con ciclo de vida (HU-M1-COB-009)
export interface TicketDia {
  id: string;
  codigoCompleto: string;
  tipo: 'ticket' | 'factura_completa' | 'rectificativa';
  fechaEmision: string;
  mesa: number | null;
  cliente: string | null;
  total: number;
  totalSinIva: number;
  totalIva: number;
  desglose: { base4: number; iva4: number; base10: number; iva10: number; base21: number; iva21: number };
  formasPago: Array<{ forma: string; importe: number }>;
  destinatarioNif: string | null;
  destinatarioNombre: string | null;
  /** HU-M1-COB-009: EMITIDA | ASIENTO_GENERADO | LIBRO_IVA_REGISTRADO | VERIFACTU_FIRMADA | CONSERVADA */
  cicloVida: 'EMITIDA' | 'ASIENTO_GENERADO' | 'LIBRO_IVA_REGISTRADO' | 'VERIFACTU_FIRMADA' | 'CONSERVADA';
  asiento: { id: string; numero: number } | null;
  verifactu: { hash: string } | null;
}

export interface TicketLinea {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  tipoIva: number;
}

/** TicketCompleto: usado en modal de factura (imprimir / WhatsApp) */
export interface TicketCompleto extends TicketDia {
  establecimiento: { nombre: string; nif: string; direccion: string; ciudad: string };
  destinatarioDireccion: string | null;
  destinatarioEmail: string | null;
  lineas: TicketLinea[];
}

export const api = {
  mesas: {
    mapa: (establecimientoId: string) =>
      request<Zona[]>(`/mesas/establecimiento/${establecimientoId}/mapa`),
    abrir: (mesaId: string, camareroId: string, comensales: number) =>
      request<{ idServicio: string }>(`/mesas/${mesaId}/abrir`, {
        method: 'POST',
        body: JSON.stringify({ camareroId, comensales }),
      }),
    abrirBarra: (camareroId: string) =>
      request<{ idServicio: string }>('/mesas/barra/abrir', {
        method: 'POST',
        body: JSON.stringify({ camareroId }),
      }),
    mover: (servicioId: string, mesaDestinoId: string) =>
      request<{ ok: boolean; mesaDestino: number }>(`/mesas/servicios/${servicioId}/mover`, {
        method: 'PATCH',
        body: JSON.stringify({ mesaDestinoId }),
      }),
    unir: (servicioOrigenId: string, servicioDestinoId: string) =>
      request<{ ok: boolean; servicioId: string }>('/mesas/servicios/unir', {
        method: 'POST',
        body: JSON.stringify({ servicioOrigenId, servicioDestinoId }),
      }),
  },

  // ---------- MENÚ TPV (catálogo para tomar comanda) ----------
  menu: {
    get: () =>
      request<{
        categorias: Array<{ id: string; nombre: string; orden: number }>;
        productos: Array<{
          id: string;
          nombre: string;
          precioConIva: number;
          tipoIva: string;
          categoriaId: string;
        }>;
      }>('/productos/catalogo'),
  },

  // ---------- COMANDAS ----------
  comandas: {
    tomar: (params: {
      servicioId: string;
      camareroId: string;
      lineas: Array<{ productoId: string; cantidad: number; modificadores?: string[]; notas?: string }>;
    }) =>
      request<any>('/comandas', { method: 'POST', body: JSON.stringify(params) }),

    cuenta: (servicioId: string) =>
      request<{
        servicioId: string;
        total: number;
        totalSinIva: number;
        desglose: { base4: number; iva4: number; base10: number; iva10: number; base21: number; iva21: number };
        lineas: Array<{
          id: string;
          productoNombre: string;
          cantidad: number;
          precioUnitario: number;
          subtotal: number;
        }>;
      }>(`/comandas/servicio/${servicioId}/cuenta`),

    dividir: (servicioId: string, modo: string, numPartes?: number, grupos?: Array<{ lineasIds: string[] }>) =>
      request<any>(`/comandas/servicio/${servicioId}/dividir`, {
        method: 'POST',
        body: JSON.stringify({ modo, numPartes, grupos }),
      }),

    anularLinea: (lineaId: string, motivo: string, empleadoId: string, rolEmpleado: string) =>
      request<any>(`/comandas/lineas/${lineaId}`, {
        method: 'DELETE',
        body: JSON.stringify({ motivo, empleadoId, rolEmpleado }),
      }),
  },

  // ---------- KDS ----------
  kds: {
    pendientes: (destino: 'COCINA' | 'BARRA') =>
      request<Array<{
        comandaId: string;
        numero: number;
        mesa: string;
        destino: string;
        horaEntrada: string;
        estado: string;
        lineas: Array<{
          lineaId: string;
          producto: string;
          cantidad: number;
          modificadores: string[];
        }>;
      }>>(`/kds/pendientes?destino=${destino}`),

    marcarPlatoListo: (lineaId: string) =>
      request<{ ok: boolean }>(`/kds/lineas/${lineaId}/listo`, { method: 'PATCH' }),

    marcarComandaLista: (comandaId: string) =>
      request<{ ok: boolean }>(`/kds/comandas/${comandaId}/lista`, { method: 'PATCH' }),
  },

  // ---------- COBROS ----------
  cobros: {
    cobrar: (
      servicioId: string,
      formasPago: Array<{ forma: string; importe: number }>,
      clienteId?: string,
    ) =>
      request<any>(`/cobros/servicio/${servicioId}`, {
        method: 'POST',
        body: JSON.stringify({ formasPago, clienteId }),
      }),

    /** HU-M1-COB-008: Listado de tickets del día con ciclo de vida */
    ticketsDia: (establecimientoId: string, fecha?: string) =>
      request<TicketDia[]>(
        `/cobros/tickets?establecimientoId=${establecimientoId}${fecha ? `&fecha=${fecha}` : ''}`,
      ),

    /** HU-M1-COB-008 (detalle): Factura completa con lineas para imprimir/WhatsApp */
    ticketCompleto: (id: string) => request<TicketCompleto>(`/cobros/tickets/${id}`),
  },

  // ---------- CAJA ----------
  caja: {
    turnoActivo: (cajaId: string) =>
      request<{ id: string; fondoCaja: number; horaApertura: string } | null>(
        `/caja/turno/activo?cajaId=${cajaId}`,
      ),
    abrirTurno: (params: { cajaId: string; empleadoId: string; fondoInicial: number }) =>
      request<any>('/caja/turno/abrir', {
        method: 'POST',
        body: JSON.stringify({
          cajaId: params.cajaId,
          empleadoId: params.empleadoId,
          fondoApertura: params.fondoInicial,
        }),
      }),
    movimiento: (params: {
      turnoCajaId: string;
      tipo: 'entrada' | 'salida';
      importe: number;
      concepto: string;
    }) =>
      request<any>(`/caja/turno/${params.turnoCajaId}/movimiento`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: params.tipo,
          importe: params.importe,
          concepto: params.concepto,
          empleadoId: 'system',
        }),
      }),
    cerrar: (params: { turnoCajaId: string; conteoEfectivo: number }) =>
      request<any>(`/caja/turno/${params.turnoCajaId}/cerrar`, {
        method: 'POST',
        body: JSON.stringify({
          contadoEfectivo: params.conteoEfectivo,
          empleadoId: 'system',
        }),
      }),
  },

  // ---------- CATÁLOGO (backoffice) ----------
  catalogo: {
    listarProductos: (establecimientoId: string) =>
      request<any[]>(`/catalogo/productos?establecimientoId=${establecimientoId}`),
    crearProducto: (p: {
      establecimientoId: string; nombre: string; descripcion?: string;
      precioConIva: number; tipoIva: string; categoriaId: string;
    }) => request<any>('/catalogo/productos', { method: 'POST', body: JSON.stringify(p) }),
    actualizarProducto: (id: string, p: Partial<{ nombre: string; precioConIva: number; tipoIva: string; categoriaId: string; activo: boolean }>) =>
      request<any>(`/catalogo/productos/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
    listarCategorias: () => request<any[]>('/catalogo/categorias'),
    crearCategoria: (p: { nombre: string; destino?: string; orden?: number }) =>
      request<any>('/catalogo/categorias', { method: 'POST', body: JSON.stringify(p) }),
    listarIngredientes: () => request<any[]>('/catalogo/ingredientes'),
    crearIngrediente: (p: { nombre: string; unidadMedida: string; precioCoste: number; stockMinimo?: number }) =>
      request<any>('/catalogo/ingredientes', { method: 'POST', body: JSON.stringify(p) }),
    listarAlergenos: () => request<any[]>('/catalogo/alergenos'),
  },

  // ---------- RRHH (backoffice) ----------
  rrhh: {
    listarEmpleados: (establecimientoId: string) =>
      request<any[]>(`/rrhh/empleados?establecimientoId=${establecimientoId}`),
    crearEmpleado: (p: {
      establecimientoId: string; nombre: string; apellidos: string;
      nif: string; email?: string; telefono?: string; puesto: string;
    }) => request<any>('/rrhh/empleados', { method: 'POST', body: JSON.stringify(p) }),
    actualizarEmpleado: (id: string, p: Partial<{ nombre: string; apellidos: string; email: string; telefono: string; puesto: string; activo: boolean }>) =>
      request<any>(`/rrhh/empleados/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
    registrarFichaje: (empleadoId: string, tipo: 'entrada' | 'salida') =>
      request<any>('/rrhh/fichajes', { method: 'POST', body: JSON.stringify({ empleadoId, tipo }) }),
  },

  // ---------- COMPRAS (backoffice) ----------
  compras: {
    listarProveedores: (establecimientoId: string) =>
      request<any[]>(`/compras/proveedores?establecimientoId=${establecimientoId}`),
    crearProveedor: (p: { establecimientoId: string; nombre: string; nif: string; direccion?: string; telefono?: string; email?: string }) =>
      request<any>('/compras/proveedores', { method: 'POST', body: JSON.stringify(p) }),
    listarPedidos: (proveedorId: string) =>
      request<any[]>(`/compras/pedidos?proveedorId=${proveedorId}`),
    crearPedido: (p: {
      proveedorId: string; fechaEntrega?: string;
      lineas: Array<{ ingredienteId: string; descripcion: string; cantidadPedida: number; unidadMedida: string; precioEstimado?: number }>;
    }) => request<any>('/compras/pedidos', { method: 'POST', body: JSON.stringify(p) }),
    listarFacturas: (proveedorId: string) =>
      request<any[]>(`/compras/facturas?proveedorId=${proveedorId}`),
    registrarFactura: (p: {
      proveedorId: string; numeroFactura: string; fechaFactura: string;
      baseImponible4?: number; cuotaIva4?: number;
      baseImponible10?: number; cuotaIva10?: number;
      baseImponible21?: number; cuotaIva21?: number;
    }) => request<any>('/compras/facturas', { method: 'POST', body: JSON.stringify(p) }),
    registrarAlbaran: (p: {
      proveedorId: string; pedidoId?: string; numeroAlbaran: string; almacenId: string;
      lineas: Array<{ ingredienteId: string; cantidadRecibida: number; cantidadEsperada?: number }>;
    }) => request<any>('/compras/albaranes', { method: 'POST', body: JSON.stringify(p) }),
    listarAlbaranes: (proveedorId: string) =>
      request<any[]>(`/compras/albaranes?proveedorId=${proveedorId}`),
  },

  // ---------- INVENTARIO (backoffice) ----------
  inventario: {
    listarAlmacenes: (establecimientoId: string) =>
      request<any[]>(`/inventario/almacenes?establecimientoId=${establecimientoId}`),
    consultarStock: (almacenId?: string) =>
      request<any[]>(`/inventario/stock${almacenId ? `?almacenId=${almacenId}` : ''}`),
    registrarConteo: (almacenId: string, conteos: Array<{ ingredienteId: string; cantidadContada: number }>) =>
      request<any>('/inventario/conteo', { method: 'POST', body: JSON.stringify({ almacenId, conteos }) }),
  },

  // ---------- FISCAL (M3) ----------
  fiscal: {
    ivaTrimestral: (year: number, trimestre: number) =>
      request<any>(`/fiscal/iva-trimestral?year=${year}&trimestre=${trimestre}`),
    modelo303: (year: number, trimestre: number) =>
      request<any>(`/fiscal/modelo303?year=${year}&trimestre=${trimestre}`),
    libroRegistro: (year: number, trimestre: number) =>
      request<any>(`/fiscal/libro-registro?year=${year}&trimestre=${trimestre}`),
  },

  // ---------- CONTABILIDAD (M3) ----------
  contable: {
    balance: (desde?: string, hasta?: string, establecimientoId?: string) => {
      const params: string[] = [];
      if (desde) params.push(`desde=${desde}`);
      if (hasta) params.push(`hasta=${hasta}`);
      if (establecimientoId) params.push(`establecimientoId=${establecimientoId}`);
      return request<any[]>(`/contable/balance${params.length ? '?' + params.join('&') : ''}`);
    },
    diario: (desde: string, hasta: string, establecimientoId?: string) => {
      const params = [`desde=${desde}`, `hasta=${hasta}`];
      if (establecimientoId) params.push(`establecimientoId=${establecimientoId}`);
      return request<any[]>(`/contable/diario?${params.join('&')}`);
    },
    cierreCaja: (establecimientoId: string, fecha?: string) =>
      request<{
        fecha: string; totalFacturado: number; totalCobrado: number;
        diferencia: number; numFacturas: number; cuadrado: boolean;
      }>(`/contable/cierre?establecimientoId=${establecimientoId}${fecha ? `&fecha=${fecha}` : ''}`),
  },
};

