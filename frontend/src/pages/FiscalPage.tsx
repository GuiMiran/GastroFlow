import { useState } from 'react';
import { api } from '../api';

const TRIMESTRES = [1, 2, 3, 4];
const YEAR_DEFAULT = new Date().getFullYear();

type Tab = 'iva' | 'modelo303' | 'libro';

interface IvaData {
  totalBaseImponible: number;
  totalCuotaRepercutida: number;
  totalBaseIva4: number; cuotaIva4: number;
  totalBaseIva10: number; cuotaIva10: number;
  totalBaseIva21: number; cuotaIva21: number;
  totalIvaSoportado: number;
  resultadoLiquidacion: number;
}

interface Modelo303 {
  year: number; trimestre: number; ejercicio: string;
  casilla01: number; casilla03: number; casilla06: number;
  casilla08: number; casilla10: number; casilla12: number;
  casilla15: number; casilla20: number;
  resultadoDiferencial: number;
  aIngresar: number; aDevolver: number;
}

interface LibroRegistro {
  emitidas: Array<{
    fecha: string; serie: string; numero: string;
    receptor: string; base: number; cuotaIva: number; total: number;
  }>;
  recibidas: Array<{
    fecha: string; serie: string; numero: string;
    emisor: string; base: number; cuotaIva: number; total: number;
  }>;
}

export default function FiscalPage() {
  const [tab, setTab] = useState<Tab>('iva');
  const [year, setYear] = useState(YEAR_DEFAULT);
  const [trimestre, setTrimestre] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ivaData, setIvaData] = useState<IvaData | null>(null);
  const [modelo303, setModelo303] = useState<Modelo303 | null>(null);
  const [libro, setLibro] = useState<LibroRegistro | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'iva') {
        const d = await api.fiscal.ivaTrimestral(year, trimestre);
        setIvaData(d);
      } else if (tab === 'modelo303') {
        const d = await api.fiscal.modelo303(year, trimestre);
        setModelo303(d);
      } else {
        const d = await api.fiscal.libroRegistro(year, trimestre);
        setLibro(d);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0) + ' €';

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Gestión Fiscal</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
        {([['iva', 'IVA Trimestral'], ['modelo303', 'Modelo 303'], ['libro', 'Libros de Registro']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => { setTab(t); setIvaData(null); setModelo303(null); setLibro(null); }}
            style={{
              padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 600,
              borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
              color: tab === t ? '#2563eb' : '#6b7280',
              background: 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Selector de período */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 500 }}>Año:</label>
        <input
          type="number" value={year} min={2020} max={2099}
          onChange={e => setYear(Number(e.target.value))}
          style={{ width: '90px', padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
        />
        <label style={{ fontWeight: 500 }}>Trimestre:</label>
        <select
          value={trimestre}
          onChange={e => setTrimestre(Number(e.target.value))}
          style={{ padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
        >
          {TRIMESTRES.map(t => <option key={t} value={t}>{t}T</option>)}
        </select>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '0.45rem 1.2rem', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
          }}
        >
          {loading ? 'Cargando…' : 'Consultar'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.8rem 1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* IVA Trimestral */}
      {tab === 'iva' && ivaData && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>
            Liquidación IVA {year} · {trimestre}T
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={th}>Concepto</th><th style={{ ...th, textAlign: 'right' }}>Base</th><th style={{ ...th, textAlign: 'right' }}>Cuota</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={td}>IVA Repercutido 4%</td><td style={{ ...td, textAlign: 'right' }}>{fmt(ivaData.totalBaseIva4)}</td><td style={{ ...td, textAlign: 'right' }}>{fmt(ivaData.cuotaIva4)}</td></tr>
              <tr><td style={td}>IVA Repercutido 10%</td><td style={{ ...td, textAlign: 'right' }}>{fmt(ivaData.totalBaseIva10)}</td><td style={{ ...td, textAlign: 'right' }}>{fmt(ivaData.cuotaIva10)}</td></tr>
              <tr><td style={td}>IVA Repercutido 21%</td><td style={{ ...td, textAlign: 'right' }}>{fmt(ivaData.totalBaseIva21)}</td><td style={{ ...td, textAlign: 'right' }}>{fmt(ivaData.cuotaIva21)}</td></tr>
              <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 600 }}>
                <td style={td}>Total Repercutido</td>
                <td style={{ ...td, textAlign: 'right' }}>{fmt(ivaData.totalBaseImponible)}</td>
                <td style={{ ...td, textAlign: 'right' }}>{fmt(ivaData.totalCuotaRepercutida)}</td>
              </tr>
              <tr>
                <td style={td} colSpan={2}>IVA Soportado (deducible)</td>
                <td style={{ ...td, textAlign: 'right', color: '#dc2626' }}>−{fmt(ivaData.totalIvaSoportado)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{
            marginTop: '1.5rem', padding: '1rem 1.5rem', borderRadius: '8px',
            background: ivaData.resultadoLiquidacion >= 0 ? '#fef9c3' : '#dcfce7',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Resultado liquidación</span>
            <span style={{ fontWeight: 700, fontSize: '1.3rem', color: ivaData.resultadoLiquidacion >= 0 ? '#b45309' : '#166534' }}>
              {ivaData.resultadoLiquidacion >= 0 ? 'A INGRESAR' : 'A DEVOLVER'}: {fmt(Math.abs(ivaData.resultadoLiquidacion))}
            </span>
          </div>
        </div>
      )}

      {/* Modelo 303 */}
      {tab === 'modelo303' && modelo303 && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>
            Modelo 303 · {modelo303.ejercicio ?? `${year}`} · {trimestre}T
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {([
              ['01 — Base imponible 4%', modelo303.casilla01],
              ['03 — Base imponible 10%', modelo303.casilla03],
              ['06 — Base imponible 21%', modelo303.casilla06],
              ['08 — Cuota repercutida 4%', modelo303.casilla08],
              ['10 — Cuota repercutida 10%', modelo303.casilla10],
              ['12 — Cuota repercutida 21%', modelo303.casilla12],
              ['15 — Total cuota devengada', modelo303.casilla15],
              ['20 — IVA soportado deducible', modelo303.casilla20],
            ] as [string, number][]).map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.8rem', background: '#f9fafb', borderRadius: '6px' }}>
                <span style={{ color: '#374151', fontSize: '0.9rem' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{fmt(val)}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '1.5rem', padding: '1rem 1.5rem', borderRadius: '8px',
            background: (modelo303.aIngresar ?? 0) > 0 ? '#fef9c3' : '#dcfce7',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Resultado</span>
            <span style={{ fontWeight: 700, fontSize: '1.3rem', color: (modelo303.aIngresar ?? 0) > 0 ? '#b45309' : '#166534' }}>
              {(modelo303.aIngresar ?? 0) > 0
                ? `A INGRESAR: ${fmt(modelo303.aIngresar)}`
                : `A DEVOLVER: ${fmt(modelo303.aDevolver ?? 0)}`}
            </span>
          </div>
        </div>
      )}

      {/* Libro de Registro */}
      {tab === 'libro' && libro && (
        <div>
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Facturas Emitidas</h2>
            <LibroTable rows={libro.emitidas ?? []} tipo="emisor" />
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Facturas Recibidas</h2>
            <LibroTable rows={libro.recibidas ?? []} tipo="receptor" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !ivaData && !modelo303 && !libro && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Selecciona año y trimestre y pulsa Consultar
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '0.6rem 0.8rem', textAlign: 'left', fontSize: '0.85rem',
  fontWeight: 600, color: '#374151', border: '1px solid #e5e7eb',
};
const td: React.CSSProperties = {
  padding: '0.55rem 0.8rem', fontSize: '0.9rem', border: '1px solid #f3f4f6',
};

function LibroTable({ rows, tipo }: { rows: any[]; tipo: 'emisor' | 'receptor' }) {
  if (!rows.length) return <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin registros</p>;
  const partyKey = tipo === 'emisor' ? 'receptor' : 'emisor';
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f9fafb' }}>
          {['Fecha', 'Núm.', tipo === 'emisor' ? 'Receptor' : 'Emisor', 'Base', 'Cuota IVA', 'Total'].map(h => (
            <th key={h} style={{ ...th, textAlign: h === 'Fecha' || h === 'Núm.' ? 'left' : 'right' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={td}>{r.fecha?.slice(0, 10) ?? '—'}</td>
            <td style={td}>{r.numero ?? r.serie ?? '—'}</td>
            <td style={td}>{r[partyKey] ?? '—'}</td>
            <td style={{ ...td, textAlign: 'right' }}>{fmtN(r.base)}</td>
            <td style={{ ...td, textAlign: 'right' }}>{fmtN(r.cuotaIva)}</td>
            <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmtN(r.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function fmtN(n: number) {
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0) + ' €';
}
