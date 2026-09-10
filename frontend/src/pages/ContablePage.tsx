import { useState, useEffect, useCallback, useContext } from 'react';
import { api } from '../api';
import { AppContext } from '../context/AppContext';

// ─── Types (match backend exportarDiario output) ─────────────────────────────

interface CierreCaja {
  fecha: string; totalFacturado: number; totalCobrado: number;
  diferencia: number; numFacturas: number; cuadrado: boolean;
}

interface BalanceRow {
  cuenta: string; totalCargo: number; totalAbono: number; saldo: number;
}

interface Apunte {
  id: string; cuenta: string; concepto: string; debe: number; haber: number;
}

interface Asiento {
  id: string; numero: number; fecha: string;
  concepto: string; origen: string; facturaRef: string | null;
  cuadrado: boolean; totalDebe: number; totalHaber: number;
  apuntes: Apunte[];
}

type Tab = 'balance' | 'diario';

const TODAY = new Date().toISOString().slice(0, 10);

// PGC Pymes Hostelería — cuentas usadas en GastroFlow
const PGC_MAP: Record<string, string> = {
  '430': 'Clientes',
  '570': 'Caja (Efectivo)',
  '572': 'Bancos c/c',
  '700': 'Ventas de Mercancías',
  '477': 'H.P. IVA Repercutido',
  '472': 'H.P. IVA Soportado',
  '400': 'Proveedores',
  '600': 'Compras de Mercancías',
  '621': 'Reparaciones y Conservación',
  '640': 'Sueldos y Salarios',
  '642': 'Seguridad Social',
  '765': 'Ingresos financieros',
};

const PGC_COLOR: Record<string, string> = {
  '430': '#f59e0b', '570': '#22c55e', '572': '#10b981',
  '700': '#818cf8', '477': '#f59e0b', '472': '#fb923c',
  '400': '#ef4444', '600': '#ef4444',
};

function CuentaBadge({ cuenta }: { cuenta: string }) {
  const nombre = PGC_MAP[cuenta] ?? cuenta;
  const color = PGC_COLOR[cuenta] ?? '#94a3b8';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
      background: color + '18', color, border: `1px solid ${color}33`,
      whiteSpace: 'nowrap',
    }}>
      ({cuenta}) {nombre}
    </span>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0) + ' \u20ac';
}

export default function ContablePage() {
  const { state } = useContext(AppContext);
  const eid = state.establecimientoId;

  const [tab, setTab] = useState<Tab>('diario');
  const [desde, setDesde] = useState(TODAY);
  const [hasta, setHasta] = useState(TODAY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cierre, setCierre] = useState<CierreCaja | null>(null);
  const [balance, setBalance] = useState<BalanceRow[] | null>(null);
  const [diario, setDiario] = useState<Asiento[] | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Cierre de caja always loads for today
  const cargarCierre = useCallback(async () => {
    if (!eid) return;
    try { setCierre(await api.contable.cierreCaja(eid, desde)); } catch { /* silent */ }
  }, [eid, desde]);

  useEffect(() => { void cargarCierre(); }, [cargarCierre]);

  const fetchData = useCallback(async () => {
    if (!eid) return;
    setLoading(true); setError(null);
    try {
      if (tab === 'balance') {
        setBalance(await api.contable.balance(desde, hasta, eid));
      } else {
        const d = await api.contable.diario(desde, hasta, eid);
        setDiario(d as Asiento[]);
        setExpandedIds(new Set());
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [tab, desde, hasta, eid]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  function toggleAsiento(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalLineas = diario?.reduce((s, a) => s + a.apuntes.length, 0) ?? 0;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>\uD83E\uDDE0</span>
          <h1 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 }}>
            M\u00f3dulo de Contabilidad
          </h1>
        </div>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Asientos generados autom\u00e1ticamente \u00b7 Invariante #1 garantizada (INV-030 partida doble)
        </p>
      </div>

      {/* ── Cierre de Caja Diario ─────────────────────────────────────────── */}
      <section style={{
        background: '#12122a', border: '1px solid #1e1e38', borderRadius: 12,
        padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>Cierre de Caja Diario</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>AccountingAgent \u2014 comparativa ventas vs facturas</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="date" value={desde} onChange={e => { setDesde(e.target.value); setHasta(e.target.value); }}
              style={{ background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #333', borderRadius: 7, padding: '7px 10px', fontSize: 13 }} />
            {cierre && !cierre.cuadrado && (
              <span style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                Descuadre detectado
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: cierre && !cierre.cuadrado ? 14 : 0 }}>
          {[
            { icon: '\uD83D\uDCC8', label: 'Total Facturado', valor: cierre ? fmt(cierre.totalFacturado) : '—', color: '#22c55e' },
            { icon: '\uD83D\uDCB8', label: 'Total Cobrado (Caja)', valor: cierre ? fmt(cierre.totalCobrado) : '—', color: '#3b82f6' },
            { icon: '\u2696\uFE0F', label: 'Diferencia', valor: cierre ? fmt(cierre.diferencia) : '—', color: cierre?.cuadrado ? '#22c55e' : '#ef4444' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: '#0d0d22', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{kpi.icon}</div>
              <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                {kpi.label}
              </div>
              <div style={{ color: kpi.color, fontSize: 24, fontWeight: 800 }}>{kpi.valor}</div>
            </div>
          ))}
        </div>

        {cierre && !cierre.cuadrado && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ef444411', border: '1px solid #ef444433', borderRadius: 8, padding: '10px 14px', marginTop: 4 }}>
            <span>\uD83D\uDD04</span>
            <span style={{ color: '#fca5a5', fontSize: 13 }}>
              Hay una diferencia de <strong>{fmt(cierre.diferencia)}</strong> entre las facturas emitidas y los cobros registrados. Revisa los pedidos pagados sin factura.
            </span>
          </div>
        )}
        {cierre?.cuadrado && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: 8, padding: '10px 14px', marginTop: 4 }}>
            <span>\u2705</span>
            <span style={{ color: '#86efac', fontSize: 13 }}>Caja cuadrada \u2014 {cierre.numFacturas} documento{cierre.numFacturas !== 1 ? 's' : ''} registrado{cierre.numFacturas !== 1 ? 's' : ''}.</span>
          </div>
        )}
      </section>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {([['diario', `\uD83D\uDCDA Libro Diario \u2014 Asientos`, diario?.length ?? 0] as [Tab, string, number],
           ['balance', '\uD83D\uDCCA Balance de Sumas y Saldos', balance?.length ?? 0]] as [Tab, string, number][]).map(([t, label, count]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '9px 18px', border: '1px solid', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              background: tab === t ? '#4f46e5' : 'transparent',
              color: tab === t ? '#fff' : '#64748b',
              borderColor: tab === t ? '#4f46e5' : '#1e1e38',
            }}
          >
            {label}
            {t === 'diario' && diario && (
              <span style={{ marginLeft: 8, background: '#ffffff22', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>
                {totalLineas} l\u00edneas
              </span>
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Range picker for balance */}
        {tab === 'balance' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              style={{ background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #333', borderRadius: 7, padding: '7px 10px', fontSize: 13 }} />
            <span style={{ color: '#555' }}>\u2192</span>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              style={{ background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #333', borderRadius: 7, padding: '7px 10px', fontSize: 13 }} />
          </div>
        )}
        <button onClick={fetchData} disabled={loading}
          style={{ background: '#1e1e38', color: '#e2e8f0', border: '1px solid #333', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          {loading ? '\u2026' : '\u21bb Actualizar'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#2d1a1a', border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444', padding: '12px 16px', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* ── LIBRO DIARIO ──────────────────────────────────────────────────────── */}
      {tab === 'diario' && (
        <div>
          {diario?.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>Sin asientos en el per\u00edodo seleccionado.</div>
          )}
          {(diario ?? []).map(asiento => {
            const expanded = expandedIds.has(asiento.id);
            return (
              <div key={asiento.id} style={{ marginBottom: 8 }}>
                {/* Header row */}
                <div
                  onClick={() => toggleAsiento(asiento.id)}
                  style={{
                    background: '#12122a', border: `1px solid ${expanded ? '#4f46e5' : '#1e1e38'}`,
                    borderRadius: expanded ? '10px 10px 0 0' : 10,
                    padding: '12px 16px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'border-color .15s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 14, fontFamily: 'monospace' }}>
                      {asiento.facturaRef ?? `#${asiento.numero}`}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                      {new Date(asiento.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' '}
                      {new Date(asiento.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>{asiento.concepto}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: asiento.cuadrado ? '#22c55e22' : '#ef444422',
                      color: asiento.cuadrado ? '#22c55e' : '#ef4444',
                      border: `1px solid ${asiento.cuadrado ? '#22c55e44' : '#ef444444'}`,
                    }}>
                      {asiento.cuadrado ? 'Cuadrado' : 'Descuadrado'}
                    </span>
                    <span style={{ color: '#555', fontSize: 16 }}>{expanded ? '\u25B2' : '\u25BC'}</span>
                  </div>
                </div>

                {/* Expanded apuntes */}
                {expanded && (
                  <div style={{ background: '#0d0d22', border: '1px solid #4f46e5', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                    {/* Column headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 120px 120px', gap: 8, padding: '8px 16px', borderBottom: '1px solid #1e1e38' }}>
                      {['Cuenta', 'Descripci\u00f3n', 'Debe', 'Haber'].map((h, i) => (
                        <span key={h} style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
                      ))}
                    </div>
                    {asiento.apuntes.map((ap) => (
                      <div key={ap.id} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 120px 120px', gap: 8, padding: '9px 16px', borderBottom: '1px solid #111128' }}>
                        <div><CuentaBadge cuenta={ap.cuenta} /></div>
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>{ap.concepto}</span>
                        <span style={{ textAlign: 'right', fontWeight: 700, color: ap.debe > 0 ? '#60a5fa' : '#333', fontSize: 13 }}>
                          {ap.debe > 0 ? `\u00d7 ${fmt(ap.debe)}` : '\u2014'}
                        </span>
                        <span style={{ textAlign: 'right', fontWeight: 700, color: ap.haber > 0 ? '#4ade80' : '#333', fontSize: 13 }}>
                          {ap.haber > 0 ? `+ ${fmt(ap.haber)}` : '\u2014'}
                        </span>
                      </div>
                    ))}
                    {/* Totals footer */}
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 120px 120px', gap: 8, padding: '9px 16px', background: '#1a1a2e' }}>
                      <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Totales</span>
                      <span />
                      <span style={{ textAlign: 'right', color: '#60a5fa', fontWeight: 800, fontSize: 13 }}>{fmt(asiento.totalDebe)}</span>
                      <span style={{ textAlign: 'right', color: '#4ade80', fontWeight: 800, fontSize: 13 }}>{fmt(asiento.totalHaber)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── BALANCE ──────────────────────────────────────────────────────────── */}
      {tab === 'balance' && (
        <div style={{ background: '#12122a', border: '1px solid #1e1e38', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e1e38' }}>
                {['Cuenta PGC', 'Suma Debe', 'Suma Haber', 'Saldo'].map((h, i) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(balance ?? []).length === 0 && !loading && (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>Sin movimientos en el per\u00edodo</td></tr>
              )}
              {(balance ?? []).map(row => {
                const isDeudor = row.saldo > 0;
                const isAcred = row.saldo < 0;
                const color = isDeudor ? '#60a5fa' : isAcred ? '#ef4444' : '#64748b';
                return (
                  <tr key={row.cuenta} style={{ borderBottom: '1px solid #0d0d22' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <CuentaBadge cuenta={row.cuenta} />
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: '#60a5fa', fontWeight: 600 }}>{fmt(row.totalCargo)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: '#4ade80', fontWeight: 600 }}>{fmt(row.totalAbono)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, color }}>
                      {fmt(Math.abs(row.saldo))}
                      <span style={{ fontSize: 10, marginLeft: 4 }}>{isDeudor ? 'D' : isAcred ? 'A' : ''}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(balance ?? []).length > 0 && (
            <div style={{ padding: '10px 16px', background: '#0d0d22', display: 'flex', justifyContent: 'flex-end', gap: 24, borderTop: '1px solid #1e1e38' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>Total Debe: <strong style={{ color: '#60a5fa' }}>{fmt((balance ?? []).reduce((s, r) => s + r.totalCargo, 0))}</strong></span>
              <span style={{ color: '#64748b', fontSize: 13 }}>Total Haber: <strong style={{ color: '#4ade80' }}>{fmt((balance ?? []).reduce((s, r) => s + r.totalAbono, 0))}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
