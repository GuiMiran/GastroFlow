import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

type Destino = 'COCINA' | 'BARRA';

interface KdsLinea {
  lineaId: string;
  producto: string;
  cantidad: number;
  modificadores: string[];
}

interface KdsComanda {
  comandaId: string;
  numero: number;
  mesa: string;
  destino: string;
  horaEntrada: string;
  estado: string;
  lineas: KdsLinea[];
  // optimistic: set of lineaIds marked done locally
  _marcadas?: Set<string>;
}

function minutosDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function colorTiempo(min: number): string {
  if (min < 5) return '#16a34a';   // verde — fresco
  if (min < 15) return '#d97706';  // naranja — atención
  return '#dc2626';                // rojo — urgente
}

function badgeTiempo(min: number) {
  const color = colorTiempo(min);
  return (
    <span style={{
      backgroundColor: color,
      color: '#fff',
      borderRadius: 6,
      padding: '2px 10px',
      fontSize: '0.8rem',
      fontWeight: 700,
      minWidth: 48,
      textAlign: 'center',
      display: 'inline-block',
    }}>
      {min < 1 ? '<1 min' : `${min} min`}
    </span>
  );
}

export function KdsPage() {
  const { destino: destinoParam } = useParams<{ destino: string }>();
  const navigate = useNavigate();

  const destino: Destino = destinoParam?.toUpperCase() === 'BARRA' ? 'BARRA' : 'COCINA';
  const otraDestino: Destino = destino === 'COCINA' ? 'BARRA' : 'COCINA';

  const [comandas, setComandas] = useState<KdsComanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const sseRef = useRef<EventSource | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await api.kds.pendientes(destino);
      setComandas((prev) => {
        // Preserve optimistic _marcadas state across refreshes
        return data.map((c) => ({
          ...c,
          _marcadas: prev.find((p) => p.comandaId === c.comandaId)?._marcadas ?? new Set(),
        }));
      });
    } catch {
      // keep existing data on polling error
    } finally {
      setLoading(false);
    }
  }, [destino]);

  // Initial load plus a periodic reconciliation in case an SSE event is missed.
  useEffect(() => {
    setLoading(true);
    cargar();
    const interval = setInterval(cargar, 60000);
    return () => clearInterval(interval);
  }, [cargar]);

  // Tick every 30s to refresh elapsed time badges
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  // SSE real-time updates
  useEffect(() => {
    const es = new EventSource('/api/v1/kds/stream');
    sseRef.current = es;

    es.addEventListener('comanda_nueva', (e: MessageEvent) => {
      const comanda = JSON.parse(e.data) as KdsComanda;
      const visibleEnPantalla = destino === 'COCINA'
        ? comanda.destino === 'COCINA' || comanda.destino === 'AMBOS'
        : comanda.destino === 'BARRA' || comanda.destino === 'AMBOS';

      if (!visibleEnPantalla) return;

      setComandas((prev) => [
        ...prev.filter((item) => item.comandaId !== comanda.comandaId),
        { ...comanda, _marcadas: new Set() },
      ]);
    });
    es.addEventListener('comanda_lista', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setComandas((prev) => prev.filter((c) => c.comandaId !== data.comandaId));
    });
    es.addEventListener('plato_listo', (e: MessageEvent) => {
      const { comandaId, lineaId } = JSON.parse(e.data) as { comandaId: string; lineaId: string };
      setComandas((prev) => prev.map((comanda) => {
        if (comanda.comandaId !== comandaId) return comanda;
        return { ...comanda, _marcadas: new Set([...(comanda._marcadas ?? []), lineaId]) };
      }));
    });

    return () => { es.close(); sseRef.current = null; };
  }, [cargar]);

  const handlePlatoListo = async (comandaId: string, lineaId: string) => {
    // Optimistic update
    setComandas((prev) => prev.map((c) => {
      if (c.comandaId !== comandaId) return c;
      const nuevas = new Set(c._marcadas);
      nuevas.add(lineaId);
      return { ...c, _marcadas: nuevas };
    }));
    try {
      await api.kds.marcarPlatoListo(lineaId);
    } catch {
      // revert on error
      setComandas((prev) => prev.map((c) => {
        if (c.comandaId !== comandaId) return c;
        const revert = new Set(c._marcadas);
        revert.delete(lineaId);
        return { ...c, _marcadas: revert };
      }));
    }
  };

  const handleComandaLista = async (comandaId: string) => {
    // Optimistic: remove from list immediately
    setComandas((prev) => prev.filter((c) => c.comandaId !== comandaId));
    try {
      await api.kds.marcarComandaLista(comandaId);
    } catch {
      await cargar(); // restore if error
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#1e293b',
        borderBottom: '2px solid #334155',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '1.5rem' }}>{destino === 'COCINA' ? '🍳' : '🍺'}</span>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.05em' }}>
            KDS — {destino}
          </h1>
          <span style={{
            background: '#334155',
            borderRadius: 20,
            padding: '2px 14px',
            fontSize: '0.85rem',
            color: '#94a3b8',
          }}>
            {comandas.length} pendiente{comandas.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate(`/kds/${otraDestino.toLowerCase()}`)}
            style={{
              background: '#334155',
              border: 'none',
              borderRadius: 8,
              color: '#cbd5e1',
              padding: '8px 18px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {otraDestino === 'COCINA' ? '🍳' : '🍺'} {otraDestino}
          </button>
          <button
            onClick={() => navigate('/sala')}
            style={{
              background: '#475569',
              border: 'none',
              borderRadius: 8,
              color: '#f1f5f9',
              padding: '8px 18px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            ← Sala
          </button>
        </div>
      </header>

      {/* Body */}
      <main style={{ padding: 24 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 80, color: '#64748b', fontSize: '1.2rem' }}>
            ⏳ Cargando...
          </div>
        )}

        {!loading && comandas.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80, color: '#475569' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: '1.3rem', fontWeight: 600 }}>Sin comandas pendientes</p>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Se actualizará automáticamente</p>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {comandas.map((comanda) => {
            const min = Math.floor((now - new Date(comanda.horaEntrada).getTime()) / 60000);
            const todasMarcadas = comanda.lineas.every(
              (l) => comanda._marcadas?.has(l.lineaId)
            );

            return (
              <div
                key={comanda.comandaId}
                style={{
                  background: '#1e293b',
                  borderRadius: 12,
                  border: `2px solid ${min >= 15 ? '#dc2626' : min >= 5 ? '#d97706' : '#334155'}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Card header */}
                <div style={{
                  padding: '12px 16px',
                  background: '#0f172a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #334155',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                      {comanda.mesa === 'Barra' ? '🍺 Barra' : `🗺️ Mesa ${comanda.mesa}`}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      #{comanda.numero}
                    </span>
                  </div>
                  {badgeTiempo(min)}
                </div>

                {/* Lineas */}
                <div style={{ padding: '12px 16px', flex: 1 }}>
                  {comanda.lineas.map((linea) => {
                    const marcada = comanda._marcadas?.has(linea.lineaId);
                    return (
                      <div
                        key={linea.lineaId}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderBottom: '1px solid #1e293b',
                          opacity: marcada ? 0.4 : 1,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                            <span style={{
                              fontSize: '1.4rem',
                              fontWeight: 800,
                              color: marcada ? '#64748b' : '#f1f5f9',
                              minWidth: 28,
                            }}>
                              {linea.cantidad}×
                            </span>
                            <span style={{
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: marcada ? '#64748b' : '#e2e8f0',
                              textDecoration: marcada ? 'line-through' : 'none',
                            }}>
                              {linea.producto}
                            </span>
                          </div>
                          {linea.modificadores.length > 0 && (
                            <div style={{ marginLeft: 38, marginTop: 2 }}>
                              {linea.modificadores.map((m, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#f59e0b',
                                    marginRight: 6,
                                    fontStyle: 'italic',
                                  }}
                                >
                                  ⚑ {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          disabled={marcada}
                          onClick={() => handlePlatoListo(comanda.comandaId, linea.lineaId)}
                          style={{
                            background: marcada ? '#1e293b' : '#16a34a',
                            border: `1px solid ${marcada ? '#334155' : '#15803d'}`,
                            borderRadius: 8,
                            color: marcada ? '#475569' : '#fff',
                            width: 36,
                            height: 36,
                            cursor: marcada ? 'default' : 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginLeft: 8,
                            transition: 'background 0.15s',
                          }}
                          title="Marcar plato listo"
                        >
                          ✓
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Footer: marcar toda la comanda */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid #334155' }}>
                  <button
                    onClick={() => handleComandaLista(comanda.comandaId)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: todasMarcadas ? '#16a34a' : '#0f766e',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    ✅ COMANDA LISTA
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
