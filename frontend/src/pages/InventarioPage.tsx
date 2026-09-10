import { useState, useEffect } from 'react';
import { api } from '../api';
import { useApp } from '../hooks/useApp';

interface StockItem {
  ingredienteId: string;
  nombre: string;
  unidad: string;
  actual: number;
  minimo: number;
  almacen: string;
  alerta: boolean;
  negativo: boolean;
}

export function InventarioPage() {
  const { notify } = useApp();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'alerta' | 'ok'>('todos');
  const [busqueda, setBusqueda] = useState('');

  // modal conteo
  const [modalConteo, setModalConteo] = useState(false);
  const [almacenId, setAlmacenId] = useState('');
  const [conteos, setConteos] = useState<Array<{ ingredienteId: string; nombre: string; cantidadContada: number }>>([]);

  const loadStock = async () => {
    setLoading(true);
    try {
      const data = await api.inventario.consultarStock() as StockItem[];
      setStock(data);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStock(); }, []);

  const abrirConteo = () => {
    // Pre-poblar los conteos con los ingredientes actuales en stock
    const items = stockFiltrado.map((s) => ({
      ingredienteId: s.ingredienteId,
      nombre: s.nombre,
      cantidadContada: s.actual,
    }));
    setConteos(items);
    // Usamos el almacén del primer item si existe
    const primerAlmacen = stock[0]?.almacen ?? '';
    setAlmacenId(primerAlmacen);
    setModalConteo(true);
  };

  const actualizarConteo = (idx: number, valor: number) =>
    setConteos(conteos.map((c, i) => i === idx ? { ...c, cantidadContada: valor } : c));

  const guardarConteo = async () => {
    if (!almacenId) {
      notify('Se necesita un almacenId', 'error');
      return;
    }
    try {
      const r = await api.inventario.registrarConteo(
        almacenId,
        conteos.map(({ ingredienteId, cantidadContada }) => ({ ingredienteId, cantidadContada })),
      ) as any;
      const conDesv = r.desviaciones?.filter((d: any) => d.diferencia !== 0).length ?? 0;
      notify(`Conteo registrado — ${conDesv} desviaciones`, 'success');
      setModalConteo(false);
      loadStock();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const stockFiltrado = stock
    .filter((s) => {
      if (filtro === 'alerta') return s.alerta || s.negativo;
      if (filtro === 'ok') return !s.alerta && !s.negativo;
      return true;
    })
    .filter((s) => !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const alertas = stock.filter((s) => s.alerta || s.negativo).length;

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Cargando inventario...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>📊 Inventario / Stock</h2>
          {alertas > 0 && (
            <div style={{ marginTop: 4, color: '#dc2626', fontWeight: 600, fontSize: '0.9rem' }}>
              ⚠️ {alertas} ingrediente{alertas > 1 ? 's' : ''} bajo mínimo o negativo
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={abrirConteo} disabled={stock.length === 0}>
          📋 Registrar Conteo
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ width: 220 }}
          placeholder="🔍 Buscar ingrediente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {(['todos', 'alerta', 'ok'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '6px 14px', border: '1px solid', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: filtro === f ? '#3b82f6' : 'transparent',
              color: filtro === f ? '#fff' : f === 'alerta' ? '#dc2626' : '#64748b',
              borderColor: filtro === f ? '#3b82f6' : f === 'alerta' ? '#fca5a5' : '#e2e8f0',
            }}
          >
            {f === 'todos' ? `Todos (${stock.length})` : f === 'alerta' ? `⚠️ Alerta (${alertas})` : `✅ OK (${stock.length - alertas})`}
          </button>
        ))}
        <button className="btn btn-outline" style={{ marginLeft: 'auto', padding: '6px 14px' }} onClick={loadStock}>
          🔄 Actualizar
        </button>
      </div>

      {stock.length === 0
        ? <div className="empty-state"><div className="icon">📭</div>Sin datos de stock. Registra un albarán de compras primero.</div>
        : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Estado', 'Ingrediente', 'Almacén', 'Stock actual', 'Mín.', 'Diferencia'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockFiltrado.map((s) => {
                const diff = s.actual - s.minimo;
                return (
                  <tr key={s.ingredienteId} style={{ borderBottom: '1px solid #e2e8f0', background: s.negativo ? '#fef2f2' : s.alerta ? '#fffbeb' : undefined }}>
                    <td style={{ padding: '10px 12px' }}>
                      {s.negativo
                        ? <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 NEGATIVO</span>
                        : s.alerta
                          ? <span style={{ color: '#d97706', fontWeight: 700 }}>⚠️ BAJO</span>
                          : <span style={{ color: '#059669' }}>✅ OK</span>}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.nombre}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{s.almacen}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: s.negativo ? '#dc2626' : s.alerta ? '#d97706' : '#0f172a' }}>
                      {s.actual.toFixed(2)} {s.unidad}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{s.minimo.toFixed(2)} {s.unidad}</td>
                    <td style={{ padding: '10px 12px', color: diff < 0 ? '#dc2626' : '#64748b', fontWeight: diff < 0 ? 700 : 400 }}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(2)} {s.unidad}
                    </td>
                  </tr>
                );
              })}
              {stockFiltrado.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        )}

      {/* ══ Modal Conteo ══ */}
      {modalConteo && (
        <div className="modal-overlay" onClick={() => setModalConteo(false)}>
          <div className="modal" style={{ width: 520, maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📋 Conteo de Inventario</div>
            <div className="form-group">
              <label className="form-label">Almacén (ID) *</label>
              <input className="form-input" value={almacenId} onChange={(e) => setAlmacenId(e.target.value)} placeholder="UUID del almacén" />
            </div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Cantidades reales contadas:</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: 12 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ingrediente</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Teórico</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 140 }}>Contado</th>
                </tr>
              </thead>
              <tbody>
                {conteos.map((c, i) => {
                  const teorico = stock.find((s) => s.ingredienteId === c.ingredienteId)?.actual ?? 0;
                  return (
                    <tr key={c.ingredienteId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px' }}>{c.nombre}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>{teorico.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          className="form-input"
                          type="number"
                          step="0.01"
                          style={{ padding: '4px 8px', textAlign: 'right' }}
                          value={c.cantidadContada}
                          onChange={(e) => actualizarConteo(i, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModalConteo(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarConteo} disabled={!almacenId}>
                Registrar conteo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
