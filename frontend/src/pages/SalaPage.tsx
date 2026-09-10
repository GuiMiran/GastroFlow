import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Zona } from '../api';
import { useApp } from '../hooks/useApp';

type Modo = 'normal' | 'mover' | 'unir';

interface AccionMesa {
  mesaId: string;
  numero: number;
  estado: string;
  servicioId: string;
}

export function SalaPage() {
  const { state, notify } = useApp();
  const navigate = useNavigate();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mesaId: string; numero: number } | null>(null);
  const [accionModal, setAccionModal] = useState<AccionMesa | null>(null);
  const [comensales, setComensales] = useState(2);
  const [modo, setModo] = useState<Modo>('normal');
  const [servicioOrigen, setServicioOrigen] = useState<AccionMesa | null>(null);

  // Validar que hay establecimientoId antes de cargar
  useEffect(() => {
    if (!state.establecimientoId) {
      notify('No hay establecimiento seleccionado. Configura primero.', 'error');
      navigate('/');
      return;
    }
  }, [state.establecimientoId, navigate, notify]);

  const fetchMapa = async () => {
    if (!state.establecimientoId) return; // Guard clause
    
    try {
      const data = await api.mesas.mapa(state.establecimientoId);
      setZonas(data);
    } catch (e: any) {
      notify(`Error al cargar mapa: ${e.message}. Verifica el ID del establecimiento.`, 'error');
      // Si el establecimiento no existe, redirigir al setup
      if (e.message?.includes('404') || e.message?.includes('not found')) {
        setTimeout(() => navigate('/'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapa();
    const interval = setInterval(fetchMapa, 10000); // Auto-refresh each 10s
    return () => clearInterval(interval);
  }, []);

  const cancelarModo = () => {
    setModo('normal');
    setServicioOrigen(null);
  };

  const handleClickMesa = (mesa: any) => {
    // ── Modos especiales ──────────────────────────────────────
    if (modo === 'mover' && servicioOrigen) {
      if (mesa.estado !== 'libre') {
        notify('Selecciona una mesa LIBRE como destino', 'error');
        return;
      }
      api.mesas
        .mover(servicioOrigen.servicioId, mesa.id)
        .then((r) => {
          notify(`Mesa ${servicioOrigen.numero} movida → mesa ${r.mesaDestino}`, 'success');
          cancelarModo();
          fetchMapa();
        })
        .catch((e: any) => notify(e.message, 'error'));
      return;
    }

    if (modo === 'unir' && servicioOrigen) {
      const servicioDestino = mesa.servicios?.find((s: any) => s.abierto);
      if (!servicioDestino) {
        notify('Selecciona una mesa OCUPADA como destino', 'error');
        return;
      }
      if (mesa.id === servicioOrigen.mesaId) {
        notify('Elige una mesa distinta', 'error');
        return;
      }
      api.mesas
        .unir(servicioOrigen.servicioId, servicioDestino.id)
        .then(() => {
          notify(
            `Mesa ${servicioOrigen.numero} unida con mesa ${mesa.numero}`,
            'success',
          );
          cancelarModo();
          fetchMapa();
        })
        .catch((e: any) => notify(e.message, 'error'));
      return;
    }

    // ── Modo normal ───────────────────────────────────────────
    if (mesa.estado === 'libre') {
      setModal({ mesaId: mesa.id, numero: mesa.numero });
      setComensales(2);
    } else if (mesa.estado === 'ocupada' || mesa.estado === 'pendiente_cobro') {
      const servicio = mesa.servicios?.find((s: any) => s.abierto);
      if (servicio) {
        setAccionModal({
          mesaId: mesa.id,
          numero: mesa.numero,
          estado: mesa.estado,
          servicioId: servicio.id,
        });
      }
    }
  };

  const handleAbrirMesa = async () => {
    if (!modal) return;
    try {
      const result = await api.mesas.abrir(modal.mesaId, state.empleadoId, comensales);
      notify(`Mesa ${modal.numero} abierta`, 'success');
      setModal(null);
      navigate(`/comanda/${result.idServicio}`);
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const handleAbrirBarra = async () => {
    try {
      const result = await api.mesas.abrirBarra(state.empleadoId);
      notify('Servicio de barra abierto', 'success');
      navigate(`/comanda/${result.idServicio}`);
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const iniciarMover = () => {
    if (!accionModal) return;
    setServicioOrigen(accionModal);
    setAccionModal(null);
    setModo('mover');
    notify(`Mesa ${accionModal.numero}: click en la mesa LIBRE destino`, 'success');
  };

  const iniciarUnir = () => {
    if (!accionModal) return;
    setServicioOrigen(accionModal);
    setAccionModal(null);
    setModo('unir');
    notify(`Mesa ${accionModal.numero}: click en la mesa que quieres UNIR`, 'success');
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Cargando mapa de sala...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Mapa de Sala</h2>
        <button className="btn btn-primary" onClick={handleAbrirBarra}>
          🍺 Servicio Barra
        </button>
      </div>

      {/* Banner modo selección */}
      {modo !== 'normal' && (
        <div
          style={{
            background: modo === 'mover' ? '#1d4ed8' : '#7c3aed',
            color: '#fff',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            {modo === 'mover'
              ? `🔀 Moviendo Mesa ${servicioOrigen?.numero} — Haz click en una mesa LIBRE`
              : `🔗 Uniendo Mesa ${servicioOrigen?.numero} — Haz click en la mesa destino (ocupada)`}
          </span>
          <button
            className="btn btn-outline"
            style={{ color: '#fff', borderColor: '#fff', padding: '4px 12px' }}
            onClick={cancelarModo}
          >
            Cancelar
          </button>
        </div>
      )}

      {zonas.map((zona) => (
        <div key={zona.id} className="zona-section">
          <div className="zona-title">{zona.nombre}</div>
          <div className="mesas-grid">
            {zona.mesas.map((mesa) => {
              // Resaltar mesas válidas en modo selección
              let highlight = '';
              if (modo === 'mover' && mesa.estado === 'libre') highlight = ' mesa-highlight-mover';
              if (modo === 'unir' && (mesa.estado === 'ocupada' || mesa.estado === 'pendiente_cobro') && mesa.id !== servicioOrigen?.mesaId) highlight = ' mesa-highlight-unir';

              return (
                <div
                  key={mesa.id}
                  className={`mesa-card ${mesa.estado}${highlight}`}
                  onClick={() => handleClickMesa(mesa)}
                >
                  <div className="mesa-numero">{mesa.numero}</div>
                  <div className="mesa-estado">
                    {mesa.estado === 'libre' && '✅ Libre'}
                    {mesa.estado === 'ocupada' && '🟠 Ocupada'}
                    {mesa.estado === 'reservada' && '🔵 Reservada'}
                    {mesa.estado === 'pendiente_cobro' && '🔴 Pdte Cobro'}
                  </div>
                  <div className="mesa-cap">👥 {mesa.capacidad}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal Abrir Mesa */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Abrir Mesa {modal.numero}</div>
            <div className="form-group">
              <label className="form-label">Comensales</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={20}
                value={comensales}
                onChange={(e) => setComensales(Number(e.target.value))}
              />
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-success" onClick={handleAbrirMesa}>
                Abrir Mesa →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Acciones Mesa Ocupada */}
      {accionModal && (
        <div className="modal-overlay" onClick={() => setAccionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Mesa {accionModal.numero}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setAccionModal(null);
                  navigate(
                    accionModal.estado === 'pendiente_cobro'
                      ? `/cobro/${accionModal.servicioId}`
                      : `/comanda/${accionModal.servicioId}`,
                  );
                }}
              >
                {accionModal.estado === 'pendiente_cobro' ? '💰 Ir a Cobro' : '📋 Ver Comanda'}
              </button>
              <button className="btn btn-outline" onClick={iniciarMover}>
                🔀 Mover Mesa
              </button>
              <button className="btn btn-outline" onClick={iniciarUnir}>
                🔗 Unir con otra Mesa
              </button>
              <button className="btn btn-outline" onClick={() => setAccionModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
