import { useState, useEffect } from 'react';
import { api } from '../api';
import { useApp } from '../hooks/useApp';

type Tab = 'proveedores' | 'pedidos' | 'albaranes' | 'facturas';

/** Auxiliar para mostrar un campo de detalle en la vista expandida de factura */
function FacturaInfo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#0f172a' }}>{children}</div>
    </div>
  );
}

export function ComprasPage() {
  const { state, notify } = useApp();
  const [tab, setTab] = useState<Tab>('proveedores');

  const [proveedores, setProveedores] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [albaranes, setAlbaranes] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [proveedorSel, setProveedorSel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // ── Modal proveedor ──
  const [modalProv, setModalProv] = useState(false);
  const [fpNombre, setFpNombre] = useState('');
  const [fpNif, setFpNif] = useState('');
  const [fpDireccion, setFpDireccion] = useState('');
  const [fpTel, setFpTel] = useState('');
  const [fpEmail, setFpEmail] = useState('');

  // ── Modal pedido ──
  const [modalPedido, setModalPedido] = useState(false);
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [ppFechaEntrega, setPpFechaEntrega] = useState('');
  const [ppLineas, setPpLineas] = useState([
    { ingredienteId: '', descripcion: '', cantidadPedida: 1, unidadMedida: 'kg', precioEstimado: 0 },
  ]);

  // ── Modal albarán ──
  const [modalAlbaran, setModalAlbaran] = useState(false);
  const [abNumero, setAbNumero] = useState('');
  const [abPedidoId, setAbPedidoId] = useState('');
  const [abAlmacenId, setAbAlmacenId] = useState('');
  const [abLineas, setAbLineas] = useState([
    { ingredienteId: '', cantidadRecibida: 1, cantidadEsperada: 0 },
  ]);

  // ── Modal factura ──
  const [modalFactura, setModalFactura] = useState(false);
  const [fNumero, setFNumero] = useState('');
  const [fFecha, setFFecha] = useState(new Date().toISOString().slice(0, 10));
  const [fBase4, setFBase4] = useState('');
  const [fIva4, setFIva4] = useState('');
  const [fBase10, setFBase10] = useState('');
  const [fIva10, setFIva10] = useState('');
  const [fBase21, setFBase21] = useState('');
  const [fIva21, setFIva21] = useState('');

  const loadProveedores = async () => {
    setLoading(true);
    try {
      const [provs, ings, alms] = await Promise.all([
        api.compras.listarProveedores(state.establecimientoId),
        api.catalogo.listarIngredientes(),
        api.inventario.listarAlmacenes(state.establecimientoId),
      ]);
      setProveedores(provs);
      setIngredientes(ings);
      setAlmacenes(alms);
      if (alms.length > 0 && !abAlmacenId) setAbAlmacenId(alms[0].id);
      if (provs.length > 0 && !proveedorSel) {
        setProveedorSel(provs[0].id);
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPedidosYFacturas = async () => {
    if (!proveedorSel) return;
    try {
      const [peds, albs, facts] = await Promise.all([
        api.compras.listarPedidos(proveedorSel),
        api.compras.listarAlbaranes(proveedorSel),
        api.compras.listarFacturas(proveedorSel),
      ]);
      setPedidos(peds);
      setAlbaranes(albs);
      setFacturas(facts);
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  useEffect(() => { loadProveedores(); }, []);
  useEffect(() => { loadPedidosYFacturas(); }, [proveedorSel]);

  // ── Proveedor ──
  const guardarProveedor = async () => {
    try {
      await api.compras.crearProveedor({
        establecimientoId: state.establecimientoId,
        nombre: fpNombre, nif: fpNif,
        direccion: fpDireccion || undefined,
        telefono: fpTel || undefined,
        email: fpEmail || undefined,
      });
      notify('Proveedor creado', 'success');
      setModalProv(false);
      setFpNombre(''); setFpNif(''); setFpDireccion(''); setFpTel(''); setFpEmail('');
      loadProveedores();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  // ── Estado detalle factura expandida ──
  const [facturaExpandida, setFacturaExpandida] = useState<string | null>(null);

  // ── Pedido ──
  const addLinea = () =>
    setPpLineas([...ppLineas, { ingredienteId: '', descripcion: '', cantidadPedida: 1, unidadMedida: 'kg', precioEstimado: 0 }]);

  const removeLinea = (i: number) =>
    setPpLineas(ppLineas.filter((_, idx) => idx !== i));

  const updateLinea = (i: number, field: string, value: any) =>
    setPpLineas(ppLineas.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const guardarPedido = async () => {
    if (!proveedorSel) return;
    try {
      await api.compras.crearPedido({
        proveedorId: proveedorSel,
        fechaEntrega: ppFechaEntrega || undefined,
        lineas: ppLineas.map((l) => ({
          ...l,
          cantidadPedida: Number(l.cantidadPedida),
          precioEstimado: Number(l.precioEstimado) || undefined,
        })),
      });
      notify('Pedido creado', 'success');
      setModalPedido(false);
      setPpFechaEntrega(''); setPpLineas([{ ingredienteId: '', descripcion: '', cantidadPedida: 1, unidadMedida: 'kg', precioEstimado: 0 }]);
      setTab('pedidos');
      loadPedidosYFacturas();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const estadoBadge = (e: string) => {
    const map: Record<string, string> = { pendiente: '#f59e0b', recibido: '#10b981', cancelado: '#ef4444' };
    return (
      <span style={{ background: map[e] ?? '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600 }}>
        {e}
      </span>
    );
  };

  // ── Albarán ──
  const addAbLinea = () =>
    setAbLineas([...abLineas, { ingredienteId: '', cantidadRecibida: 1, cantidadEsperada: 0 }]);

  const removeAbLinea = (i: number) =>
    setAbLineas(abLineas.filter((_, idx) => idx !== i));

  const updateAbLinea = (i: number, field: string, value: any) =>
    setAbLineas(abLineas.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const guardarAlbaran = async () => {
    if (!proveedorSel || !abNumero || !abAlmacenId) return;
    try {
      await api.compras.registrarAlbaran({
        proveedorId: proveedorSel,
        pedidoId: abPedidoId || undefined,
        numeroAlbaran: abNumero,
        almacenId: abAlmacenId,
        lineas: abLineas.map((l) => ({
          ingredienteId: l.ingredienteId,
          cantidadRecibida: Number(l.cantidadRecibida),
          cantidadEsperada: l.cantidadEsperada ? Number(l.cantidadEsperada) : undefined,
        })),
      });
      notify('Albarán registrado — stock actualizado', 'success');
      setModalAlbaran(false);
      setAbNumero(''); setAbPedidoId('');
      setAbLineas([{ ingredienteId: '', cantidadRecibida: 1, cantidadEsperada: 0 }]);
      loadPedidosYFacturas();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  // ── Factura ──
  const guardarFactura = async () => {
    if (!proveedorSel || !fNumero || !fFecha) return;
    try {
      await api.compras.registrarFactura({
        proveedorId: proveedorSel,
        numeroFactura: fNumero,
        fechaFactura: fFecha,
        baseImponible4: fBase4 ? Number(fBase4) : undefined,
        cuotaIva4: fIva4 ? Number(fIva4) : undefined,
        baseImponible10: fBase10 ? Number(fBase10) : undefined,
        cuotaIva10: fIva10 ? Number(fIva10) : undefined,
        baseImponible21: fBase21 ? Number(fBase21) : undefined,
        cuotaIva21: fIva21 ? Number(fIva21) : undefined,
      });
      notify('Factura registrada — asiento contable generado', 'success');
      setModalFactura(false);
      setFNumero(''); setFFecha(new Date().toISOString().slice(0, 10));
      setFBase4(''); setFIva4(''); setFBase10(''); setFIva10(''); setFBase21(''); setFIva21('');
      loadPedidosYFacturas();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Cargando compras...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>🛒 Compras</h2>
        {/* Selector de proveedor */}
        {proveedores.length > 0 && (
          <select
            className="form-input"
            style={{ width: 240 }}
            value={proveedorSel}
            onChange={(e) => setProveedorSel(e.target.value)}
          >
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        {(['proveedores', 'pedidos', 'albaranes', 'facturas'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', border: 'none', cursor: 'pointer',
              background: tab === t ? '#3b82f6' : 'transparent',
              color: tab === t ? '#fff' : '#64748b',
              borderRadius: '6px 6px 0 0', fontWeight: 600, fontSize: '0.9rem',
            }}
          >
            {t === 'proveedores' ? `🏭 Proveedores (${proveedores.length})`
              : t === 'pedidos' ? `📋 Pedidos (${pedidos.length})`
              : t === 'albaranes' ? `📦 Albaranes (${albaranes.length})`
              : `🧾 Facturas (${facturas.length})`}
          </button>
        ))}
      </div>

      {/* ── PROVEEDORES ── */}
      {tab === 'proveedores' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={() => setModalProv(true)}>+ Nuevo Proveedor</button>
          </div>
          {proveedores.length === 0
            ? <div className="empty-state"><div className="icon">📭</div>Sin proveedores</div>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {['Nombre', 'NIF', 'Teléfono', 'Email', 'Dirección'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: p.id === proveedorSel ? '#eff6ff' : undefined }} onClick={() => setProveedorSel(p.id)}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.nombre}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b' }}>{p.nif}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{p.telefono ?? '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{p.email ?? '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{p.direccion ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </>
      )}

      {/* ── PEDIDOS ── */}
      {tab === 'pedidos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" disabled={!proveedorSel} onClick={() => setModalPedido(true)}>+ Nuevo Pedido</button>
          </div>
          {pedidos.length === 0
            ? <div className="empty-state"><div className="icon">📭</div>Sin pedidos para este proveedor</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pedidos.map((p) => (
                  <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Pedido {new Date(p.fechaPedido).toLocaleDateString('es-ES')}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {p.fechaEntrega && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Entrega: {new Date(p.fechaEntrega).toLocaleDateString('es-ES')}</span>}
                        {estadoBadge(p.estado)}
                      </div>
                    </div>
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ color: '#64748b' }}>
                        <th style={{ textAlign: 'left', padding: '4px 8px' }}>Descripción</th>
                        <th style={{ textAlign: 'right', padding: '4px 8px' }}>Cantidad</th>
                        <th style={{ textAlign: 'left', padding: '4px 8px' }}>Unidad</th>
                        <th style={{ textAlign: 'right', padding: '4px 8px' }}>Precio est.</th>
                      </tr></thead>
                      <tbody>
                        {p.lineas?.map((l: any) => (
                          <tr key={l.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '4px 8px' }}>{l.descripcion}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right' }}>{l.cantidadPedida}</td>
                            <td style={{ padding: '4px 8px' }}>{l.unidadMedida}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right' }}>{l.precioEstimado ? `${Number(l.precioEstimado).toFixed(2)}€` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {/* ── ALBARANES ── */}
      {tab === 'albaranes' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" disabled={!proveedorSel} onClick={() => setModalAlbaran(true)}>+ Registrar Albarán</button>
          </div>
          {albaranes.length === 0
            ? <div className="empty-state"><div className="icon">📭</div>Sin albaranes para este proveedor</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {albaranes.map((a) => (
                  <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Albarán {a.numeroAlbaran}</span>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(a.fechaRecepcion).toLocaleDateString('es-ES')}</span>
                    </div>
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ color: '#64748b' }}>
                        <th style={{ textAlign: 'left', padding: '4px 8px' }}>Ingrediente</th>
                        <th style={{ textAlign: 'right', padding: '4px 8px' }}>Recibido</th>
                        <th style={{ textAlign: 'right', padding: '4px 8px' }}>Esperado</th>
                        <th style={{ textAlign: 'right', padding: '4px 8px' }}>Diferencia</th>
                      </tr></thead>
                      <tbody>
                        {a.lineas?.map((l: any) => (
                          <tr key={l.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '4px 8px' }}>{l.ingredienteId}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(l.cantidadRecibida).toFixed(3)}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', color: '#64748b' }}>{l.cantidadEsperada != null ? Number(l.cantidadEsperada).toFixed(3) : '—'}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', color: l.diferencia < 0 ? '#ef4444' : l.diferencia > 0 ? '#f59e0b' : '#10b981' }}>
                              {l.diferencia != null ? (l.diferencia >= 0 ? '+' : '') + Number(l.diferencia).toFixed(3) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {/* ── FACTURAS RECIBIDAS ── */}
      {tab === 'facturas' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" disabled={!proveedorSel} onClick={() => setModalFactura(true)}>+ Registrar Factura</button>
          </div>

          {/* KPIs del proveedor seleccionado */}
          {facturas.length > 0 && (() => {
            const totalFacturado = facturas.reduce((s: number, f: any) => s + Number(f.total), 0);
            const totalIva = facturas.reduce((s: number, f: any) => s + Number(f.totalIva), 0);
            const sinAsiento = facturas.filter((f: any) => !f.asientoContable).length;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {[{ label: 'Facturas', valor: `${facturas.length}`, color: '#3b82f6' },
                  { label: 'Total facturado', valor: `${totalFacturado.toFixed(2)} €`, color: '#0f172a' },
                  { label: 'IVA soportado', valor: `${totalIva.toFixed(2)} €`, color: '#f59e0b' },
                  { label: sinAsiento > 0 ? `${sinAsiento} sin asiento` : '✓ Contabilidad OK', valor: '', color: sinAsiento > 0 ? '#ef4444' : '#10b981' },
                ].map(({ label, valor, color }) => (
                  <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{valor}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {facturas.length === 0
            ? <div className="empty-state"><div className="icon">📭</div>Sin facturas para este proveedor</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Cabecera tabla */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 90px 90px 90px 100px 1fr 28px',
                  gap: 10,
                  padding: '8px 14px',
                  background: '#f1f5f9',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#64748b',
                }}>
                  <span>Nº FACTURA</span>
                  <span>FECHA</span>
                  <span style={{ textAlign: 'right' }}>BASE</span>
                  <span style={{ textAlign: 'right' }}>IVA</span>
                  <span style={{ textAlign: 'right' }}>TOTAL</span>
                  <span>ASIENTO</span>
                  <span></span>
                </div>

                {facturas.map((f: any) => {
                  const isOpen = facturaExpandida === f.id;
                  const hasAsiento = !!f.asientoContable;
                  const desglose = [
                    Number(f.baseImponible4) > 0 && { tipo: '4 %', base: Number(f.baseImponible4), iva: Number(f.cuotaIva4) },
                    Number(f.baseImponible10) > 0 && { tipo: '10 %', base: Number(f.baseImponible10), iva: Number(f.cuotaIva10) },
                    Number(f.baseImponible21) > 0 && { tipo: '21 %', base: Number(f.baseImponible21), iva: Number(f.cuotaIva21) },
                  ].filter(Boolean) as Array<{ tipo: string; base: number; iva: number }>;

                  return (
                    <div key={f.id}>
                      {/* Fila resumen — clickable */}
                      <div
                        onClick={() => setFacturaExpandida(isOpen ? null : f.id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '140px 90px 90px 90px 100px 1fr 28px',
                          gap: 10,
                          padding: '11px 14px',
                          background: isOpen ? '#eff6ff' : '#fff',
                          border: `1px solid ${isOpen ? '#3b82f6' : '#e2e8f0'}`,
                          borderRadius: isOpen ? '8px 8px 0 0' : 8,
                          cursor: 'pointer',
                          alignItems: 'center',
                          fontSize: '0.9rem',
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>{f.numeroFactura}</span>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(f.fechaFactura).toLocaleDateString('es-ES')}</span>
                        <span style={{ textAlign: 'right', color: '#475569' }}>{Number(f.totalSinIva).toFixed(2)} €</span>
                        <span style={{ textAlign: 'right', color: '#f59e0b' }}>{Number(f.totalIva).toFixed(2)} €</span>
                        <span style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{Number(f.total).toFixed(2)} €</span>
                        <span>
                          {hasAsiento
                            ? <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 600 }}>Asiento #{f.asientoContable.numero}</span>
                            : <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 600 }}>Sin asiento</span>
                          }
                        </span>
                        <span style={{ color: '#94a3b8', textAlign: 'center' }}>{isOpen ? '▲' : '▼'}</span>
                      </div>

                      {/* Panel de detalle expandido */}
                      {isOpen && (
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #3b82f6',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          padding: '16px 20px',
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            {/* Desglose IVA */}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: 8 }}>📊 DESGLOSE IVA</div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 500 }}>Tipo</th>
                                    <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Base imp.</th>
                                    <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Cuota IVA</th>
                                    <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {desglose.length === 0
                                    ? <tr><td colSpan={4} style={{ padding: '8px 0', color: '#94a3b8', fontStyle: 'italic' }}>Sin desglose por tipo de IVA</td></tr>
                                    : desglose.map((d) => (
                                      <tr key={d.tipo} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '5px 0', color: '#475569' }}>{d.tipo}</td>
                                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#475569' }}>{d.base.toFixed(2)} €</td>
                                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{d.iva.toFixed(2)} €</td>
                                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#0f172a' }}>{(d.base + d.iva).toFixed(2)} €</td>
                                      </tr>
                                    ))
                                  }
                                </tbody>
                                <tfoot>
                                  <tr style={{ borderTop: '2px solid #e2e8f0', fontWeight: 700 }}>
                                    <td style={{ padding: '6px 0', color: '#64748b' }}>TOTAL</td>
                                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#64748b' }}>{Number(f.totalSinIva).toFixed(2)} €</td>
                                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#f59e0b' }}>{Number(f.totalIva).toFixed(2)} €</td>
                                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#0f172a', fontSize: '1rem' }}>{Number(f.total).toFixed(2)} €</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                            {/* Metadatos */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: 0 }}>📋 DATOS FACTURA</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.85rem' }}>
                                <FacturaInfo label="Proveedor">{f.proveedor?.nombre ?? '—'}</FacturaInfo>
                                <FacturaInfo label="NIF proveedor">{f.proveedor?.nif ?? '—'}</FacturaInfo>
                                <FacturaInfo label="Fecha factura">{new Date(f.fechaFactura).toLocaleDateString('es-ES')}</FacturaInfo>
                                <FacturaInfo label="Fecha registro">{new Date(f.fechaRegistro ?? f.fechaFactura).toLocaleDateString('es-ES')}</FacturaInfo>
                                <FacturaInfo label="Asiento contable">
                                  {hasAsiento
                                    ? <span style={{ color: '#15803d', fontWeight: 600 }}>Asiento #{f.asientoContable.numero}</span>
                                    : <span style={{ color: '#ef4444' }}>Pendiente (IVA soportado)</span>
                                  }
                                </FacturaInfo>
                                <FacturaInfo label="Libro IVA recibidas">
                                  {f.libroRegistroRecibida
                                    ? <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Registrado</span>
                                    : <span style={{ color: '#f59e0b' }}>Pendiente</span>
                                  }
                                </FacturaInfo>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </>
      )}

      {/* ══ Modal Proveedor ══ */}
      {modalProv && (
        <div className="modal-overlay" onClick={() => setModalProv(false)}>
          <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Nuevo Proveedor</div>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-input" value={fpNombre} onChange={(e) => setFpNombre(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">CIF/NIF *</label>
              <input className="form-input" placeholder="B12345678" value={fpNif} onChange={(e) => setFpNif(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input className="form-input" value={fpDireccion} onChange={(e) => setFpDireccion(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={fpTel} onChange={(e) => setFpTel(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} />
              </div>
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModalProv(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarProveedor} disabled={!fpNombre || !fpNif}>Crear proveedor</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Pedido ══ */}
      {modalPedido && (
        <div className="modal-overlay" onClick={() => setModalPedido(false)}>
          <div className="modal" style={{ width: 560, maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Nuevo Pedido</div>
            <div className="form-group">
              <label className="form-label">Fecha de entrega esperada</label>
              <input className="form-input" type="date" value={ppFechaEntrega} onChange={(e) => setPpFechaEntrega(e.target.value)} />
            </div>

            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Líneas del pedido</div>
            {ppLineas.map((l, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Ingrediente</label>
                    <select className="form-input" style={{ fontSize: '0.85rem' }} value={l.ingredienteId} onChange={(e) => updateLinea(i, 'ingredienteId', e.target.value)}>
                      <option value="">— Seleccionar —</option>
                      {ingredientes.map((ing) => <option key={ing.id} value={ing.id}>{ing.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Cantidad *</label>
                    <input className="form-input" type="number" step="0.01" style={{ fontSize: '0.85rem' }} value={l.cantidadPedida} onChange={(e) => updateLinea(i, 'cantidadPedida', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Unidad</label>
                    <select className="form-input" style={{ fontSize: '0.85rem' }} value={l.unidadMedida} onChange={(e) => updateLinea(i, 'unidadMedida', e.target.value)}>
                      {['kg', 'g', 'l', 'ml', 'ud', 'caja', 'ración'].map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, marginTop: 8, alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Descripción *</label>
                    <input className="form-input" style={{ fontSize: '0.85rem' }} value={l.descripcion} onChange={(e) => updateLinea(i, 'descripcion', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Precio est. (€)</label>
                    <input className="form-input" type="number" step="0.01" style={{ fontSize: '0.85rem' }} value={l.precioEstimado} onChange={(e) => updateLinea(i, 'precioEstimado', e.target.value)} />
                  </div>
                  {ppLineas.length > 1 && (
                    <button onClick={() => removeLinea(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem', paddingBottom: 4 }}>✕</button>
                  )}
                </div>
              </div>
            ))}
            <button className="btn btn-outline" style={{ width: '100%', marginBottom: 12 }} onClick={addLinea}>
              + Añadir línea
            </button>

            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModalPedido(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarPedido} disabled={ppLineas.some((l) => !l.descripcion || !l.ingredienteId)}>
                Crear pedido
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ══ Modal Albarán ══ */}
      {modalAlbaran && (
        <div className="modal-overlay" onClick={() => setModalAlbaran(false)}>
          <div className="modal" style={{ width: 560, maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Registrar Albarán</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nº Albarán *</label>
                <input className="form-input" value={abNumero} onChange={(e) => setAbNumero(e.target.value)} placeholder="ALB-2026-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Almacén *</label>
                <select className="form-input" value={abAlmacenId} onChange={(e) => setAbAlmacenId(e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pedido relacionado (opcional)</label>
              <select className="form-input" value={abPedidoId} onChange={(e) => setAbPedidoId(e.target.value)}>
                <option value="">— Ninguno —</option>
                {pedidos.filter((p) => p.estado === 'pendiente').map((p) => (
                  <option key={p.id} value={p.id}>Pedido {new Date(p.fechaPedido).toLocaleDateString('es-ES')}</option>
                ))}
              </select>
            </div>

            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Mercancía recibida</div>
            {abLineas.map((l, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Ingrediente</label>
                    <select className="form-input" style={{ fontSize: '0.85rem' }} value={l.ingredienteId} onChange={(e) => updateAbLinea(i, 'ingredienteId', e.target.value)}>
                      <option value="">— Seleccionar —</option>
                      {ingredientes.map((ing) => <option key={ing.id} value={ing.id}>{ing.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Recibido *</label>
                    <input className="form-input" type="number" step="0.001" style={{ fontSize: '0.85rem' }} value={l.cantidadRecibida} onChange={(e) => updateAbLinea(i, 'cantidadRecibida', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Esperado</label>
                    <input className="form-input" type="number" step="0.001" style={{ fontSize: '0.85rem' }} value={l.cantidadEsperada} onChange={(e) => updateAbLinea(i, 'cantidadEsperada', e.target.value)} />
                  </div>
                  {abLineas.length > 1 && (
                    <button onClick={() => removeAbLinea(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem', paddingBottom: 4 }}>✕</button>
                  )}
                </div>
              </div>
            ))}
            <button className="btn btn-outline" style={{ width: '100%', marginBottom: 12 }} onClick={addAbLinea}>+ Añadir línea</button>

            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModalAlbaran(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarAlbaran} disabled={!abNumero || !abAlmacenId || abLineas.some((l) => !l.ingredienteId)}>
                Registrar albarán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Factura ══ */}
      {modalFactura && (
        <div className="modal-overlay" onClick={() => setModalFactura(false)}>
          <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Registrar Factura de Proveedor</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nº Factura *</label>
                <input className="form-input" value={fNumero} onChange={(e) => setFNumero(e.target.value)} placeholder="FM-34521" />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input className="form-input" type="date" value={fFecha} onChange={(e) => setFFecha(e.target.value)} />
              </div>
            </div>

            <div style={{ fontWeight: 600, margin: '12px 0 8px', fontSize: '0.9rem', color: '#475569' }}>Desglose IVA</div>
            {[
              { label: 'IVA 4%', base: fBase4, setBase: setFBase4, iva: fIva4, setIva: setFIva4 },
              { label: 'IVA 10%', base: fBase10, setBase: setFBase10, iva: fIva10, setIva: setFIva10 },
              { label: 'IVA 21%', base: fBase21, setBase: setFBase21, iva: fIva21, setIva: setFIva21 },
            ].map(({ label, base, setBase, iva, setIva }) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, paddingBottom: 6, color: '#64748b' }}>{label}</span>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Base imp. (€)</label>
                  <input className="form-input" type="number" step="0.01" value={base} onChange={(e) => setBase(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Cuota IVA (€)</label>
                  <input className="form-input" type="number" step="0.01" value={iva} onChange={(e) => setIva(e.target.value)} placeholder="0.00" />
                </div>
              </div>
            ))}
            {(fBase4 || fBase10 || fBase21) && (
              <div style={{ background: '#f1f5f9', borderRadius: 6, padding: '8px 12px', fontSize: '0.9rem', marginBottom: 12 }}>
                Total: <strong>{(
                  (Number(fBase4) || 0) + (Number(fIva4) || 0) +
                  (Number(fBase10) || 0) + (Number(fIva10) || 0) +
                  (Number(fBase21) || 0) + (Number(fIva21) || 0)
                ).toFixed(2)} €</strong>
              </div>
            )}

            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModalFactura(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarFactura} disabled={!fNumero || !fFecha}>
                Registrar factura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
