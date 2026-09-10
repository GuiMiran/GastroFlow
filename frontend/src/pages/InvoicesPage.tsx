import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { api, TicketDia, TicketCompleto } from '../api';
import { AppContext } from '../context/AppContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TicketDia['tipo'], { text: string; color: string; bg: string }> = {
  ticket:           { text: 'Ticket',   color: '#818cf8', bg: '#4f46e522' },
  factura_completa: { text: 'Factura',  color: '#22c55e', bg: '#22c55e22' },
  rectificativa:    { text: 'Rectif.',  color: '#ef4444', bg: '#ef444422' },
};

const CICLO_LABEL: Record<TicketDia['cicloVida'], { text: string; color: string }> = {
  EMITIDA:              { text: 'Emitida',      color: '#f59e0b' },
  ASIENTO_GENERADO:     { text: 'Asiento OK',   color: '#3b82f6' },
  LIBRO_IVA_REGISTRADO: { text: 'Libro IVA',    color: '#8b5cf6' },
  VERIFACTU_FIRMADA:    { text: 'VeriFactu OK', color: '#10b981' },
  CONSERVADA:           { text: '\u2713 OK',    color: '#22c55e' },
};

const FORMA_ICON: Record<string, string> = {
  efectivo: '\uD83D\uDCB5', tarjeta: '\uD83D\uDCB3',
  bizum: '\uD83D\uDCF1', invitacion: '\uD83C\uDF81',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function eur(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// ─── Print / WhatsApp ─────────────────────────────────────────────────────────

function printTicket(t: TicketCompleto) {
  const desglose = [
    t.desglose.base4  > 0 ? { pct: 4,  base: t.desglose.base4,  iva: t.desglose.iva4  } : null,
    t.desglose.base10 > 0 ? { pct: 10, base: t.desglose.base10, iva: t.desglose.iva10 } : null,
    t.desglose.base21 > 0 ? { pct: 21, base: t.desglose.base21, iva: t.desglose.iva21 } : null,
  ].filter(Boolean) as { pct: number; base: number; iva: number }[];

  const rows = t.lineas.length > 0
    ? t.lineas.map(l => `
        <tr>
          <td style="padding:7px 0;border-bottom:1px solid #f1f5f9">${l.nombre}</td>
          <td style="padding:7px 8px;text-align:center;border-bottom:1px solid #f1f5f9">${l.cantidad}</td>
          <td style="padding:7px 0;text-align:right;border-bottom:1px solid #f1f5f9">${eur(l.precioUnitario)}</td>
          <td style="padding:7px 0;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600">${eur(l.precioUnitario * l.cantidad)}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:12px 0;color:#94a3b8;text-align:center">(sin detalle de líneas)</td></tr>`;

  const desgloseRows = desglose.map(d =>
    `<tr>
      <td style="padding:4px 0;color:#64748b">Base IVA ${d.pct}%</td>
      <td style="padding:4px 0;text-align:right;color:#64748b">${eur(d.base)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#f59e0b;font-weight:600">IVA (${d.pct}%)</td>
      <td style="padding:4px 0;text-align:right;color:#f59e0b;font-weight:600">${eur(d.iva)}</td>
    </tr>`).join('');

  const clienteBlock = (t.destinatarioNombre || t.cliente)
    ? `<div style="background:#f8fafc;border-radius:8px;padding:14px 16px;margin-bottom:24px">
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:8px">Datos del cliente</div>
        <div style="font-weight:700;color:#1e293b;font-size:1rem">${t.destinatarioNombre ?? t.cliente ?? ''}</div>
        ${t.destinatarioNif ? `<div style="color:#64748b;font-size:0.85rem">NIF/CIF: ${t.destinatarioNif}</div>` : ''}
        ${t.destinatarioDireccion ? `<div style="color:#64748b;font-size:0.85rem">${t.destinatarioDireccion}</div>` : ''}
        ${t.destinatarioEmail ? `<div style="color:#64748b;font-size:0.85rem">${t.destinatarioEmail}</div>` : ''}
      </div>`
    : '';

  const tipoLabel = t.tipo === 'factura_completa' ? 'FACTURA' : t.tipo === 'rectificativa' ? 'FACTURA RECTIFICATIVA' : 'TICKET';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${t.codigoCompleto}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 40px 32px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th { text-align: left; padding: 8px 0; border-bottom: 2px solid #1e293b; font-size: 0.72rem; text-transform: uppercase; color: #64748b; letter-spacing: 0.06em; }
    th:nth-child(2) { text-align: center; } th:nth-child(3), th:nth-child(4) { text-align: right; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
    <div>
      <div style="font-size:1.5rem;font-weight:800;color:#1e293b">\uD83C\uDF7D\uFE0F GastroFlow</div>
      <div style="font-size:0.8rem;color:#64748b;margin-top:2px">Sistema de Gestión de Restaurantes</div>
      <div style="font-size:0.8rem;color:#64748b">NIF: ${t.establecimiento.nif}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:1.4rem;font-weight:800;color:#16a34a">${t.codigoCompleto}</div>
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-top:2px">${tipoLabel}</div>
      <div style="font-size:0.85rem;color:#64748b;margin-top:2px">${formatDateLong(t.fechaEmision)}</div>
    </div>
  </div>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:20px">
  ${clienteBlock}
  <!-- Items -->
  <table style="margin-bottom:24px">
    <thead><tr><th>Concepto</th><th>Ud.</th><th>P. Unit.</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <!-- Totals -->
  <table style="width:280px;margin-left:auto;border-collapse:collapse;font-size:0.9rem">
    <tbody>
      ${desgloseRows}
      <tr style="border-top:2px solid #1e293b">
        <td style="padding:10px 0;font-size:1.2rem;font-weight:800">TOTAL</td>
        <td style="padding:10px 0;text-align:right;font-size:1.3rem;font-weight:900">${eur(t.total)}</td>
      </tr>
    </tbody>
  </table>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px">
  <p style="text-align:center;font-size:0.75rem;color:#cbd5e1">
    Gracias por su visita &middot; GastroFlow v1.0 &middot; Documento generado automáticamente
  </p>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
  document.body.appendChild(iframe);
  iframe.contentDocument!.open();
  iframe.contentDocument!.write(html);
  iframe.contentDocument!.close();
  iframe.contentWindow!.focus();
  setTimeout(() => {
    iframe.contentWindow!.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 300);
}

function whatsappLink(t: TicketCompleto): string {
  const SEP = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';
  const tipoLabel = t.tipo === 'factura_completa' ? 'FACTURA' : t.tipo === 'rectificativa' ? 'FACTURA RECTIFICATIVA' : 'TICKET';
  const lines: string[] = [
    `\uD83E\uDDFE *GASTROFLOW \u2014 ${tipoLabel}*`,
    '',
    `\uD83D\uDCC4 N\u00BA: ${t.codigoCompleto}`,
    `\uD83D\uDCC5 Fecha: ${formatDateLong(t.fechaEmision)}`,
    '',
  ];
  if (t.destinatarioNombre || t.cliente) {
    lines.push(`\uD83D\uDC64 *Cliente:* ${t.destinatarioNombre ?? t.cliente}`);
    if (t.destinatarioNif) lines.push(`\uD83C\uDD94 *NIF:* ${t.destinatarioNif}`);
    lines.push('');
  }
  if (t.lineas.length > 0) {
    lines.push(SEP, '\uD83C\uDF7D\uFE0F *Detalle*', SEP, '');
    for (const l of t.lineas) {
      const label = l.cantidad > 1 ? `${l.nombre} (x${l.cantidad})` : l.nombre;
      lines.push(`\u2022 ${label} ........ ${eur(l.precioUnitario * l.cantidad)}`);
    }
    lines.push('');
  }
  lines.push(SEP, '');
  lines.push(`\uD83D\uDCB0 Base imponible: ${eur(t.totalSinIva)}`);
  lines.push(`\uD83E\uDDFE IVA: ${eur(t.totalIva)}`);
  lines.push('');
  lines.push(SEP);
  lines.push(`\uD83C\uDFF7\uFE0F *TOTAL: ${eur(t.total)}*`);
  lines.push(SEP, '', '\uD83D\uDE4F Gracias por su visita · GastroFlow v1.0');
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}

// ─── FacturaPreview: tarjeta blanca idéntica a los screenshots ────────────────

function FacturaPreview({ t }: { t: TicketCompleto }) {
  const desglose = [
    t.desglose.base4  > 0 ? { pct: 4,  base: t.desglose.base4,  iva: t.desglose.iva4  } : null,
    t.desglose.base10 > 0 ? { pct: 10, base: t.desglose.base10, iva: t.desglose.iva10 } : null,
    t.desglose.base21 > 0 ? { pct: 21, base: t.desglose.base21, iva: t.desglose.iva21 } : null,
  ].filter(Boolean) as { pct: number; base: number; iva: number }[];

  const tipoLabel = t.tipo === 'factura_completa' ? 'FACTURA' : t.tipo === 'rectificativa' ? 'FACTURA RECTIFICATIVA' : 'TICKET SIMPLIFICADO';
  const showCliente = !!(t.destinatarioNombre || t.cliente || t.destinatarioNif);

  return (
    <div style={{
      background: '#fff', color: '#1e293b',
      borderRadius: 12, padding: '40px 40px 32px',
      maxWidth: 560, width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      fontFamily: "'Inter', Arial, sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
            🍽️ GastroFlow
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 3 }}>
            Sistema de Gestión de Restaurantes
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            NIF: {t.establecimiento.nif}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', letterSpacing: '-0.02em' }}>
            {t.codigoCompleto}
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginTop: 3 }}>
            {tipoLabel}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
            {formatDateLong(t.fechaEmision)}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: 20 }} />

      {/* Cliente */}
      {showCliente && (
        <div style={{
          background: '#f8fafc', borderRadius: 8, padding: '14px 16px', marginBottom: 24,
        }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
            Datos del cliente
          </div>
          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
            {t.destinatarioNombre ?? t.cliente}
          </div>
          {t.destinatarioNif && (
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>NIF/CIF: {t.destinatarioNif}</div>
          )}
          {t.destinatarioDireccion && (
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{t.destinatarioDireccion}</div>
          )}
          {t.destinatarioEmail && (
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{t.destinatarioEmail}</div>
          )}
        </div>
      )}

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: 24 }}>
        <thead>
          <tr>
            {['Concepto', 'Ud.', 'P. Unit.', 'Total'].map((h, i) => (
              <th key={h} style={{
                textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right',
                padding: '8px 0', borderBottom: '2px solid #1e293b',
                fontSize: '0.72rem', textTransform: 'uppercase',
                color: '#64748b', letterSpacing: '0.06em', fontWeight: 600,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.lineas.length > 0 ? t.lineas.map((l) => (
            <tr key={l.id}>
              <td style={{ padding: '7px 0', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>{l.nombre}</td>
              <td style={{ padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{l.cantidad}</td>
              <td style={{ padding: '7px 0', textAlign: 'right', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{eur(l.precioUnitario)}</td>
              <td style={{ padding: '7px 0', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b' }}>{eur(l.precioUnitario * l.cantidad)}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4} style={{ padding: '16px 0', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic', fontSize: '0.85rem' }}>
                (sin detalle de líneas)
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginBottom: 28 }}>
        {desglose.map((d) => (
          <div key={d.pct} style={{ display: 'flex', justifyContent: 'space-between', width: 260 }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Base imponible</span>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{eur(d.base)}</span>
          </div>
        ))}
        {desglose.map((d) => (
          <div key={`iva-${d.pct}`} style={{ display: 'flex', justifyContent: 'space-between', width: 260 }}>
            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem' }}>IVA ({d.pct}%)</span>
            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem' }}>{eur(d.iva)}</span>
          </div>
        ))}
        <div style={{
          borderTop: '2px solid #e2e8f0', paddingTop: 10, marginTop: 6,
          display: 'flex', justifyContent: 'space-between', width: 260,
        }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>TOTAL</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>{eur(t.total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
          Gracias por su visita &middot; GastroFlow v1.0 &middot; Documento generado automáticamente
        </span>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function FacturaModal({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const [ticket, setTicket] = useState<TicketCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.cobros.ticketCompleto(ticketId)
      .then(setTicket)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticketId]);

  // Close on overlay click
  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={handleOverlay}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.82)',
        zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        padding: '24px 16px 48px',
      }}
    >
      {/* Action bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 1,
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 16px', borderRadius: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <button
          disabled={!ticket}
          onClick={() => ticket && printTicket(ticket)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', color: '#e2e8f0',
            border: '1.5px solid #475569', borderRadius: 8,
            padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            opacity: ticket ? 1 : 0.5,
          }}
        >
          🖨️ Imprimir
        </button>
        <button
          disabled={!ticket}
          onClick={() => ticket && window.open(whatsappLink(ticket), '_blank')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#25d366', color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '9px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
            opacity: ticket ? 1 : 0.5,
          }}
        >
          💬 Enviar WhatsApp
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', color: '#94a3b8',
            border: '1.5px solid #334155', borderRadius: 8,
            padding: '9px 14px', cursor: 'pointer', fontSize: 16, fontWeight: 700,
            marginLeft: 8,
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{ width: '100%', maxWidth: 600, display: 'flex', justifyContent: 'center' }}>
        {loading && (
          <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>
            Cargando factura…
          </div>
        )}
        {error && (
          <div style={{ color: '#ef4444', background: '#2d1a1a', borderRadius: 10, padding: 20 }}>
            {error}
          </div>
        )}
        {ticket && <FacturaPreview t={ticket} />}
      </div>
    </div>
  );
}

// ─── Invoice list row ─────────────────────────────────────────────────────────

function InvoiceRow({ t, onOpen }: { t: TicketDia; onOpen: () => void }) {
  const tipo = TIPO_LABEL[t.tipo];
  const ciclo = CICLO_LABEL[t.cicloVida];

  return (
    <div style={{
      background: '#12122a', border: '1px solid #1e1e38',
      borderRadius: 10, padding: '12px 16px',
      display: 'grid',
      gridTemplateColumns: '68px 1fr 120px 90px 110px 130px 90px',
      alignItems: 'center', gap: 10,
      transition: 'border-color .15s',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e38')}
    >
      {/* Tipo badge */}
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5,
        background: tipo.bg, color: tipo.color, textAlign: 'center',
      }}>
        {tipo.text}
      </span>

      {/* Número + hora/mesa */}
      <div>
        <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
          {t.codigoCompleto}
        </div>
        <div style={{ color: '#666', fontSize: 11, marginTop: 1 }}>
          {formatDate(t.fechaEmision)}
          {t.mesa ? ` · Mesa ${t.mesa}` : ''}
        </div>
      </div>

      {/* Cliente */}
      <div style={{ color: '#aaa', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {t.destinatarioNombre ?? t.cliente ?? <span style={{ color: '#555' }}>Anónimo</span>}
      </div>

      {/* Formas de pago */}
      <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
        {t.formasPago.map((fp) => FORMA_ICON[fp.forma] ?? fp.forma).join(' ')}
      </div>

      {/* Total */}
      <div style={{
        textAlign: 'right', fontWeight: 700, fontSize: 15,
        color: t.tipo === 'rectificativa' ? '#ef4444' : '#4ade80',
      }}>
        {eur(t.total)}
      </div>

      {/* Ciclo de vida */}
      <span style={{
        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: ciclo.color + '22', color: ciclo.color,
        border: `1px solid ${ciclo.color}44`, textAlign: 'center', whiteSpace: 'nowrap',
      }}>
        {ciclo.text}
      </span>

      {/* Ver button */}
      <button
        onClick={onOpen}
        style={{
          background: '#4f46e5', color: '#fff', border: 'none',
          borderRadius: 7, padding: '7px 14px', cursor: 'pointer',
          fontSize: 12, fontWeight: 700,
        }}
      >
        Ver 🧾
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { state } = useContext(AppContext);
  const [tickets, setTickets] = useState<TicketDia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().substring(0, 10));
  const [busqueda, setBusqueda] = useState('');
  const [modalId, setModalId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!state.establecimientoId) return;
    setLoading(true); setError('');
    try {
      setTickets(await api.cobros.ticketsDia(state.establecimientoId, fecha));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, [state.establecimientoId, fecha]);

  useEffect(() => { void cargar(); }, [cargar]);

  const filtrados = tickets.filter((t) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      t.codigoCompleto.toLowerCase().includes(q) ||
      (t.cliente ?? '').toLowerCase().includes(q) ||
      (t.destinatarioNombre ?? '').toLowerCase().includes(q) ||
      (t.destinatarioNif ?? '').toLowerCase().includes(q)
    );
  });

  // KPIs
  const emitidos = tickets.filter(t => t.tipo !== 'rectificativa');
  const totalDia = emitidos.reduce((s, t) => s + t.total, 0);
  const totalIvaDia = emitidos.reduce((s, t) => s + t.totalIva, 0);
  const alertas = tickets.filter(t => !t.asiento || !t.verifactu).length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1160, margin: '0 auto' }}>

      {/* Breadcrumb flow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: '#64748b' }}>
        {[
          { icon: '🗺️', label: 'Sala', href: '/sala' },
          { icon: '💰', label: 'Caja', href: '/caja' },
          { icon: '🧮', label: 'Contabilidad', href: '/contabilidad/contable' },
          { icon: '🧾', label: 'Facturas', href: null },
        ].map((step, i) => (
          <span key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: '#334155' }}>→</span>}
            <span style={{
              color: step.href === null ? '#818cf8' : '#475569',
              fontWeight: step.href === null ? 700 : 400,
            }}>
              {step.icon} {step.label}
            </span>
          </span>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 }}>
            Registro de Facturas
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '3px 0 0' }}>
            HU-M1-COB-008 · Listado, impresión y envío por WhatsApp
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar nº, cliente, NIF…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #333',
              borderRadius: 8, padding: '8px 12px', fontSize: 13, width: 200,
            }}
          />
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
              borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}
          >
            {loading ? '…' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Documentos',     valor: tickets.length.toString(),           color: '#4f46e5' },
          { label: 'Ventas brutas',  valor: eur(totalDia),                        color: '#22c55e' },
          { label: 'IVA repercutido', valor: eur(totalIvaDia),                   color: '#f59e0b', nota: '→ Mod. 303' },
          { label: 'Alertas fiscales', valor: alertas > 0 ? `${alertas} aviso${alertas > 1 ? 's' : ''}` : '✓ Todo OK', color: alertas > 0 ? '#ef4444' : '#22c55e' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: '#12122a', border: '1px solid #1e1e38',
            borderRadius: 10, padding: '14px 18px',
          }}>
            <div style={{ color: '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
              {kpi.label}
            </div>
            <div style={{ color: kpi.color, fontSize: 22, fontWeight: 700 }}>{kpi.valor}</div>
            {'nota' in kpi && <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{(kpi as any).nota}</div>}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#2d1a1a', border: '1px solid #ef4444', borderRadius: 8,
          color: '#ef4444', padding: '12px 16px', marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Table header */}
      {filtrados.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '68px 1fr 120px 90px 110px 130px 90px',
          gap: 10, padding: '6px 16px',
          color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
          marginBottom: 6,
        }}>
          <span>Tipo</span>
          <span>Nº Factura</span>
          <span>Cliente</span>
          <span style={{ textAlign: 'center' }}>Pago</span>
          <span style={{ textAlign: 'right' }}>Total</span>
          <span>Estado</span>
          <span>Acción</span>
        </div>
      )}

      {/* List */}
      {filtrados.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555', fontSize: 14 }}>
          {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay documentos para la fecha seleccionada.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtrados.map((t) => (
            <InvoiceRow key={t.id} t={t} onOpen={() => setModalId(t.id)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalId && (
        <FacturaModal ticketId={modalId} onClose={() => setModalId(null)} />
      )}
    </div>
  );
}
