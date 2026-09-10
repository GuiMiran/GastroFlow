import { useState, useEffect, useCallback, useContext } from 'react';
import { api, TicketDia } from '../api';
import { AppContext } from '../context/AppContext';

// ─── HU-M1-COB-009: Ciclo de vida ────────────────────────────────────────────
const CICLO_LABELS: Record<TicketDia['cicloVida'], { texto: string; color: string }> = {
  EMITIDA:              { texto: 'Emitida',          color: '#f59e0b' },
  ASIENTO_GENERADO:     { texto: 'Asiento OK',        color: '#3b82f6' },
  LIBRO_IVA_REGISTRADO: { texto: 'Libro IVA',         color: '#8b5cf6' },
  VERIFACTU_FIRMADA:    { texto: 'VeriFactu OK',       color: '#10b981' },
  CONSERVADA:           { texto: '\u2713 Completo',   color: '#22c55e' },
};

const TIPO_LABELS: Record<TicketDia['tipo'], string> = {
  ticket:            'Ticket',
  factura_completa:  'Factura',
  rectificativa:     'Rectif.',
};

const FORMA_ICONS: Record<string, string> = {
  efectivo:   '\uD83D\uDCB5',
  tarjeta:    '\uD83D\uDCB3',
  bizum:      '\uD83D\uDCF1',
  invitacion: '\uD83C\uDF81',
};

// ─── Detalle expandido de un ticket ──────────────────────────────────────────
function TicketDetalle({ t }: { t: TicketDia }) {
  const desglose = [
    t.desglose.base4  > 0 && { tipo: '4 %',  base: t.desglose.base4,  iva: t.desglose.iva4  },
    t.desglose.base10 > 0 && { tipo: '10 %', base: t.desglose.base10, iva: t.desglose.iva10 },
    t.desglose.base21 > 0 && { tipo: '21 %', base: t.desglose.base21, iva: t.desglose.iva21 },
  ].filter(Boolean) as Array<{ tipo: string; base: number; iva: number }>;

  const ciclo = CICLO_LABELS[t.cicloVida];

  return (
    <div style={{
      background: '#1a1a2e',
      border: '1px solid #2a2a4a',
      borderRadius: 10,
      padding: '16px 20px',
      marginTop: 4,
    }}>
      {/* Ciclo de vida */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['EMITIDA','VERIFACTU_FIRMADA','ASIENTO_GENERADO','LIBRO_IVA_REGISTRADO','CONSERVADA'] as TicketDia['cicloVida'][]).map((estado) => {
          const achieved = ordenCiclo(t.cicloVida) >= ordenCiclo(estado);
          const l = CICLO_LABELS[estado];
          return (
            <span key={estado} style={{
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: achieved ? l.color + '22' : '#ffffff08',
              color: achieved ? l.color : '#666',
              border: `1px solid ${achieved ? l.color + '55' : '#333'}`,
            }}>
              {l.texto}
            </span>
          );
        })}
      </div>

      {/* Desglose IVA */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
        <thead>
          <tr style={{ color: '#999', borderBottom: '1px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 500 }}>Tipo IVA</th>
            <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Base</th>
            <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Cuota IVA</th>
            <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {desglose.map((d) => (
            <tr key={d.tipo}>
              <td style={{ padding: '4px 0', color: '#ccc' }}>{d.tipo}</td>
              <td style={{ padding: '4px 0', textAlign: 'right', color: '#ccc' }}>{d.base.toFixed(2)} €</td>
              <td style={{ padding: '4px 0', textAlign: 'right', color: '#f59e0b' }}>{d.iva.toFixed(2)} €</td>
              <td style={{ padding: '4px 0', textAlign: 'right', color: '#e2e8f0' }}>{(d.base + d.iva).toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '1px solid #333', fontWeight: 600 }}>
            <td style={{ padding: '6px 0', color: '#aaa' }}>TOTAL</td>
            <td style={{ padding: '6px 0', textAlign: 'right', color: '#aaa' }}>{t.totalSinIva.toFixed(2)} €</td>
            <td style={{ padding: '6px 0', textAlign: 'right', color: '#f59e0b' }}>{t.totalIva.toFixed(2)} €</td>
            <td style={{ padding: '6px 0', textAlign: 'right', color: '#4ade80', fontSize: 15 }}>{t.total.toFixed(2)} €</td>
          </tr>
        </tfoot>
      </table>

      {/* Metadatos fiscales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
        <Info label="Formas de pago">
          {t.formasPago.map((fp, i) => (
            <span key={i}>{FORMA_ICONS[fp.forma] ?? ''} {fp.importe.toFixed(2)} €</span>
          ))}
        </Info>
        <Info label="Asiento contable">
          {t.asiento
            ? <span style={{ color: '#22c55e' }}>Asiento #{t.asiento.numero}</span>
            : <span style={{ color: '#ef4444' }}>Pendiente (INV-009)</span>
          }
        </Info>
        <Info label="VeriFactu hash">
          {t.verifactu
            ? <span style={{ color: '#10b981', fontFamily: 'monospace' }}>{t.verifactu.hash}</span>
            : <span style={{ color: '#ef4444' }}>Sin hash</span>
          }
        </Info>
        {t.destinatarioNif && (
          <Info label="Destinatario">
            <span>{t.destinatarioNombre} · {t.destinatarioNif}</span>
          </Info>
        )}
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: '#666', fontSize: 11, marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{ color: '#ccc', display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  );
}

function ordenCiclo(estado: TicketDia['cicloVida']): number {
  const order: TicketDia['cicloVida'][] = ['EMITIDA','VERIFACTU_FIRMADA','ASIENTO_GENERADO','LIBRO_IVA_REGISTRADO','CONSERVADA'];
  return order.indexOf(estado);
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function FacturasPage() {
  const { state } = useContext(AppContext);
  const [tickets, setTickets] = useState<TicketDia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [fecha, setFecha] = useState(() => new Date().toISOString().substring(0, 10));

  const cargar = useCallback(async () => {
    if (!state.establecimientoId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.cobros.ticketsDia(state.establecimientoId, fecha);
      setTickets(data);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, [state.establecimientoId, fecha]);

  useEffect(() => { void cargar(); }, [cargar]);

  // Totales del día
  const totalDia = tickets.filter(t => t.tipo !== 'rectificativa').reduce((s, t) => s + t.total, 0);
  const totalIvaDia = tickets.filter(t => t.tipo !== 'rectificativa').reduce((s, t) => s + t.totalIva, 0);
  const pendientesAsiento = tickets.filter(t => !t.asiento).length;
  const pendientesVerifactu = tickets.filter(t => !t.verifactu).length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 }}>
            Facturas del día
          </h1>
          <p style={{ color: '#666', fontSize: 13, margin: '4px 0 0' }}>
            HU-M1-COB-008 · Ciclo de vida fiscal (INV-009, RN-017, RN-018)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{
              background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #333',
              borderRadius: 8, padding: '8px 12px', fontSize: 14,
            }}
          />
          <button
            onClick={cargar}
            disabled={loading}
            style={{
              background: '#4f46e5', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {loading ? '…' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs del día */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <Kpi label="Documentos" valor={tickets.length.toString()} color="#4f46e5" />
        <Kpi label="Ventas brutas" valor={`${totalDia.toFixed(2)} €`} color="#22c55e" />
        <Kpi label="IVA repercutido" valor={`${totalIvaDia.toFixed(2)} €`} color="#f59e0b"
          nota="→ Mod. 303" />
        <Kpi
          label="Alertas fiscales"
          valor={pendientesAsiento + pendientesVerifactu > 0
            ? `${pendientesAsiento + pendientesVerifactu} aviso${pendientesAsiento + pendientesVerifactu > 1 ? 's' : ''}`
            : '\u2713 Todo OK'}
          color={pendientesAsiento + pendientesVerifactu > 0 ? '#ef4444' : '#22c55e'}
        />
      </div>

      {error && (
        <div style={{ background: '#2d1a1a', border: '1px solid #ef4444', borderRadius: 8,
          color: '#ef4444', padding: '12px 16px', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Tabla de facturas */}
      {tickets.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>
          No hay documentos para el día seleccionado.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tickets.map((t) => {
            const ciclo = CICLO_LABELS[t.cicloVida];
            const isOpen = expandido === t.id;
            return (
              <div key={t.id}>
                <div
                  onClick={() => setExpandido(isOpen ? null : t.id)}
                  style={{
                    background: '#12122a',
                    border: `1px solid ${isOpen ? '#4f46e5' : '#1e1e38'}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 90px 100px 110px 130px 110px 28px',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'border-color .15s',
                  }}
                >
                  {/* Tipo */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5,
                    background: t.tipo === 'rectificativa' ? '#ef444422' : '#4f46e522',
                    color: t.tipo === 'rectificativa' ? '#ef4444' : '#818cf8',
                    textAlign: 'center',
                  }}>
                    {TIPO_LABELS[t.tipo]}
                  </span>

                  {/* Código + hora */}
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>
                      {t.codigoCompleto}
                    </div>
                    <div style={{ color: '#666', fontSize: 11 }}>
                      {new Date(t.fechaEmision).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      {t.mesa ? ` · Mesa ${t.mesa}` : ' · Barra'}
                    </div>
                  </div>

                  {/* Cliente */}
                  <div style={{ color: '#aaa', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.destinatarioNombre ?? t.cliente ?? 'Anónimo'}
                  </div>

                  {/* Forma pago */}
                  <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
                    {t.formasPago.map(fp => FORMA_ICONS[fp.forma] ?? fp.forma).join(' ')}
                  </div>

                  {/* Total */}
                  <div style={{
                    textAlign: 'right', fontWeight: 700, fontSize: 15,
                    color: t.tipo === 'rectificativa' ? '#ef4444' : '#4ade80',
                  }}>
                    {t.tipo === 'rectificativa' && t.total !== 0 ? '- ' : ''}{Math.abs(t.total).toFixed(2)} €
                  </div>

                  {/* Ciclo de vida */}
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: ciclo.color + '22', color: ciclo.color,
                    border: `1px solid ${ciclo.color}44`, textAlign: 'center',
                  }}>
                    {ciclo.texto}
                  </span>

                  {/* Asiento */}
                  <div style={{ fontSize: 11, color: t.asiento ? '#22c55e' : '#f59e0b', textAlign: 'center' }}>
                    {t.asiento ? `#${t.asiento.numero}` : '—'}
                  </div>

                  {/* Chevron */}
                  <span style={{ color: '#555', fontSize: 18, textAlign: 'right' }}>
                    {isOpen ? '\u25B2' : '\u25BC'}
                  </span>
                </div>

                {isOpen && <TicketDetalle t={t} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, valor, color, nota }: { label: string; valor: string; color: string; nota?: string }) {
  return (
    <div style={{
      background: '#12122a', border: '1px solid #1e1e38', borderRadius: 10, padding: '14px 18px',
    }}>
      <div style={{ color: '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color, fontSize: 22, fontWeight: 700 }}>{valor}</div>
      {nota && <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{nota}</div>}
    </div>
  );
}
