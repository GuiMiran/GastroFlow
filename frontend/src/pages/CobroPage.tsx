import { buildWhatsAppLink, renderInvoiceHTML } from '../utils/invoiceGen';
import type { Invoice, OrderItem } from '../utils/accounting';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../hooks/useApp';

type FormaPago = 'efectivo' | 'tarjeta' | 'bizum';

// ─── Modal de división de cuenta ────────────────────────────────────────────

interface Parte {
  numero: number;
  importe: number;
  forma: FormaPago;
}

const METODOS: { id: FormaPago; icon: string; label: string }[] = [
  { id: 'efectivo', icon: '💶', label: 'Efectivo' },
  { id: 'tarjeta', icon: '💳', label: 'Tarjeta' },
  { id: 'bizum',   icon: '📱', label: 'Bizum'   },
];

function DividirModal({
  total,
  onConfirmar,
  onCancelar,
}: {
  total: number;
  onConfirmar: (partes: Parte[]) => void;
  onCancelar: () => void;
}) {
  const [numPartes, setNumPartes] = useState(2);
  const [partes, setPartes] = useState<Parte[]>([]);
  const [calculado, setCalculado] = useState(false);

  // Calcula partes iguales con reparto de céntimos en última parte
  const calcular = () => {
    const base = Math.floor((total / numPartes) * 100) / 100;
    const resto = Math.round((total - base * (numPartes - 1)) * 100) / 100;
    const nuevas: Parte[] = Array.from({ length: numPartes }, (_, i) => ({
      numero: i + 1,
      importe: i < numPartes - 1 ? base : resto,
      forma: 'efectivo',
    }));
    setPartes(nuevas);
    setCalculado(true);
  };

  const setForma = (idx: number, forma: FormaPago) => {
    setPartes((prev) => prev.map((p, i) => i === idx ? { ...p, forma } : p));
  };

  const todasAsignadas = partes.every((p) => p.forma);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>✂️ Dividir cuenta</h3>
          <button onClick={onCancelar} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Total */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total a dividir</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{total.toFixed(2)} €</div>
          </div>

          {/* Selector de partes */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 10 }}>
              ¿Cuántas partes?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => { setNumPartes(n); setCalculado(false); }}
                  style={{
                    width: 44, height: 44, borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '1rem',
                    background: numPartes === n ? '#2563eb' : '#f1f5f9',
                    color: numPartes === n ? '#fff' : '#475569',
                    transition: 'background 0.15s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {!calculado ? (
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={calcular}
            >
              Calcular partes iguales
            </button>
          ) : (
            <>
              {/* Partes */}
              <div style={{ marginBottom: 20 }}>
                {partes.map((parte, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 10,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '10px 16px', background: '#f8fafc',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>Persona {parte.numero}</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                        {parte.importe.toFixed(2)} €
                      </span>
                    </div>
                    <div style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
                      {METODOS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setForma(idx, m.id)}
                          style={{
                            flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                            border: `2px solid ${parte.forma === m.id ? '#2563eb' : '#e2e8f0'}`,
                            background: parte.forma === m.id ? '#eff6ff' : '#fff',
                            color: parte.forma === m.id ? '#2563eb' : '#64748b',
                            fontWeight: parte.forma === m.id ? 700 : 400,
                            fontSize: '0.8rem',
                            transition: 'all 0.15s',
                          }}
                        >
                          {m.icon} {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Verificación */}
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                padding: '10px 16px', marginBottom: 16, fontSize: '0.85rem', color: '#166534',
              }}>
                ✓ Σ partes = {partes.reduce((s, p) => s + p.importe, 0).toFixed(2)} € (igual al total)
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setCalculado(false)}>
                  ← Cambiar
                </button>
                <button
                  className="btn btn-success"
                  style={{ flex: 2 }}
                  disabled={!todasAsignadas}
                  onClick={() => onConfirmar(partes)}
                >
                  ✅ Confirmar y cobrar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CobroPage() {
  const { servicioId } = useParams<{ servicioId: string }>();
  const { notify } = useApp();
  const navigate = useNavigate();

  const [cuenta, setCuenta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo');
  const [importeEntregado, setImporteEntregado] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [mostrarDividir, setMostrarDividir] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.comandas.cuenta(servicioId!);
        setCuenta(data);
        setImporteEntregado(String(data.total));
      } catch (e: any) {
        setErrorCarga(e.message ?? 'No se pudo cargar la cuenta');
        notify(e.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [servicioId]);

  const totalCuenta = cuenta?.total ?? 0;
  const entregado = parseFloat(importeEntregado) || 0;
  const cambio = entregado - totalCuenta;

  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setImporteEntregado('');
    } else if (val === '⌫') {
      setImporteEntregado((prev) => prev.slice(0, -1));
    } else {
      setImporteEntregado((prev) => prev + val);
    }
  };

  const handleCobrarConDivision = async (partes: Parte[]) => {
    setMostrarDividir(false);
    setProcesando(true);
    try {
      const result = await api.cobros.cobrar(
        servicioId!,
        partes.map((p) => ({ forma: p.forma, importe: p.importe })),
      );
      setTicketResult(result);
      notify(`✅ Cobrado (${partes.length} partes) — Ticket ${result.codigoCompleto}`, 'success');
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleCobrar = async () => {
    if (entregado < totalCuenta) {
      notify('Importe insuficiente', 'error');
      return;
    }
    setProcesando(true);
    try {
      const result = await api.cobros.cobrar(servicioId!, [
        { forma: formaPago, importe: entregado },
      ]);
      setTicketResult(result);
      notify(`✅ Cobrado — Ticket ${result.codigoCompleto}`, 'success');
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Cargando cuenta...</div>;

  if (errorCarga) {
    return (
      <div className="empty-state">
        <div className="icon">❌</div>
        <p>No se pudo cargar la cuenta</p>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 8 }}>{errorCarga}</p>
        <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={() => navigate('/sala')}>
          ← Volver a Sala
        </button>
      </div>
    );
  }

  // Pantalla post-cobro
  if (ticketResult) {
    // Build a lightweight Invoice object for invoiceGen utilities
    const invoiceItems: OrderItem[] = (cuenta?.lineas ?? []).map((l: any) => ({
      name: l.productoNombre ?? 'Producto',
      qty: Number(l.cantidad),
      price: Number(l.precioUnitario ?? (l.subtotal / l.cantidad)),
    }));
    const invoiceObj: Invoice = {
      id: ticketResult.id ?? ticketResult.codigoCompleto,
      invoiceNumber: ticketResult.codigoCompleto,
      orderId: servicioId!,
      customerId: '',
      customer: undefined,
      items: invoiceItems,
      subtotal: Number(cuenta?.totalSinIva ?? ticketResult.total / 1.1),
      vat: Number(ticketResult.total) - Number(cuenta?.totalSinIva ?? ticketResult.total / 1.1),
      total: Number(ticketResult.total),
      createdAt: new Date().toISOString(),
    };

    function handlePrint() {
      const html = renderInvoiceHTML(invoiceObj, {
        id: '', name: 'Ticket simplificado', nif: '',
      });
      const win = window.open('', '_blank', 'width=750,height=900');
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }

    return (
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 40 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 8 }}>Cobro realizado</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#16a34a', marginBottom: 16 }}>
            Ticket: {ticketResult.codigoCompleto}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'left', marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Total</div>
              <div className="stat-value" style={{ fontSize: '1.3rem' }}>{Number(ticketResult.total).toFixed(2)} €</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cambio</div>
              <div className="stat-value" style={{ fontSize: '1.3rem', color: cambio > 0 ? '#16a34a' : undefined }}>
                {cambio > 0 ? cambio.toFixed(2) + ' €' : '—'}
              </div>
            </div>
          </div>

          {/* HU-M1-COB-007: Imprimir / WhatsApp */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              className="btn btn-outline"
              style={{ flex: 1, fontSize: '1rem' }}
              onClick={handlePrint}
            >
              🖨️ Imprimir
            </button>
            <a
              href={buildWhatsAppLink(invoiceObj)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ flex: 1, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              📲 WhatsApp
            </a>
          </div>

          <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/sala')}>
            ← Volver a Sala
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {mostrarDividir && (
        <DividirModal
          total={totalCuenta}
          onConfirmar={handleCobrarConDivision}
          onCancelar={() => setMostrarDividir(false)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>💳 Cobrar Servicio</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-outline"
            onClick={() => setMostrarDividir(true)}
            disabled={procesando || totalCuenta <= 0}
          >
            ✂️ Dividir
          </button>
          <button className="btn btn-outline" onClick={() => navigate(`/comanda/${servicioId}`)}>
            ← Volver a Comanda
          </button>
        </div>
      </div>

      <div className="cobro-layout">
        {/* Resumen cuenta */}
        <div className="card">
          <div className="card-header">Resumen de cuenta</div>

          {cuenta?.lineas?.map((l: any) => (
            <div key={l.id} className="ticket-line">
              <div className="ticket-line-info">
                <div className="ticket-line-name">{l.productoNombre || 'Producto'}</div>
                <div className="ticket-line-detail">{l.cantidad} uds</div>
              </div>
              <div className="ticket-line-total">{Number(l.subtotal).toFixed(2)} €</div>
            </div>
          ))}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px solid #e2e8f0' }}>
            {cuenta?.desglose && (
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>
                {cuenta.desglose.base10 > 0 && <div>Base 10%: {Number(cuenta.desglose.base10).toFixed(2)} € · IVA: {Number(cuenta.desglose.iva10).toFixed(2)} €</div>}
                {cuenta.desglose.base21 > 0 && <div>Base 21%: {Number(cuenta.desglose.base21).toFixed(2)} € · IVA: {Number(cuenta.desglose.iva21).toFixed(2)} €</div>}
                {cuenta.desglose.base4 > 0 && <div>Base 4%: {Number(cuenta.desglose.base4).toFixed(2)} € · IVA: {Number(cuenta.desglose.iva4).toFixed(2)} €</div>}
              </div>
            )}
            <div className="ticket-total">
              <span>TOTAL</span>
              <span>{Number(totalCuenta).toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Panel de pago */}
        <div className="card">
          <div className="card-header">Forma de pago</div>

          <div className="pago-metodo">
            {([
              { id: 'efectivo', icon: '💶', label: 'Efectivo' },
              { id: 'tarjeta', icon: '💳', label: 'Tarjeta' },
              { id: 'bizum', icon: '📱', label: 'Bizum' },
            ] as const).map((m) => (
              <div
                key={m.id}
                className={`pago-btn ${formaPago === m.id ? 'selected' : ''}`}
                onClick={() => {
                  setFormaPago(m.id);
                  if (m.id !== 'efectivo') {
                    setImporteEntregado(String(totalCuenta));
                  }
                }}
              >
                <div className="icon">{m.icon}</div>
                <div>{m.label}</div>
              </div>
            ))}
          </div>

          {formaPago === 'efectivo' && (
            <>
              <div className="form-group">
                <label className="form-label">Importe entregado</label>
                <input
                  className="form-input"
                  style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'right' }}
                  value={importeEntregado}
                  onChange={(e) => setImporteEntregado(e.target.value)}
                />
              </div>

              <div className="numpad">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.'].map((k) => (
                  <button key={k} onClick={() => handleNumpad(k)}>{k}</button>
                ))}
              </div>

              <div className={`cambio-display ${cambio >= 0 ? 'positivo' : 'pendiente'}`}>
                {cambio >= 0
                  ? `Cambio: ${cambio.toFixed(2)} €`
                  : `Faltan: ${Math.abs(cambio).toFixed(2)} €`
                }
              </div>

              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[5, 10, 20, 50].map((v) => (
                  <button
                    key={v}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setImporteEntregado(String(v))}
                  >
                    {v} €
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            className="btn btn-success btn-block btn-lg"
            disabled={procesando || entregado < totalCuenta}
            onClick={handleCobrar}
          >
            {procesando ? '⏳ Procesando...' : `✅ Cobrar ${Number(totalCuenta).toFixed(2)} €`}
          </button>
        </div>
      </div>
    </div>
  );
}
