import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useApp } from '../hooks/useApp';

export function CajaPage() {
  const { state, setState, notify } = useApp();
  const [turno, setTurno] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Abrir/Cerrar turno form
  const [fondoInicial, setFondoInicial] = useState('100');
  const [conteoEfectivo, setConteoEfectivo] = useState('');

  // Movimiento form
  const [movTipo, setMovTipo] = useState<'entrada' | 'salida'>('entrada');
  const [movImporte, setMovImporte] = useState('');
  const [movConcepto, setMovConcepto] = useState('');

  const turnoActivo = !!state.turnoCajaId;

  // On mount: if we have a cajaId but no turnoCajaId in session,
  // query the backend to rehydrate an existing open turn (e.g. after page refresh).
  useEffect(() => {
    if (state.cajaId && !state.turnoCajaId) {
      api.caja.turnoActivo(state.cajaId).then((t) => {
        if (t) {
          setState({ turnoCajaId: t.id });
          setTurno(t);
        }
      }).catch(() => { /* backend not ready yet — silently ignore */ });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAbrirTurno = async () => {
    if (!state.cajaId || !state.empleadoId) {
      notify('Configura primero Caja y Empleado en Setup', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await api.caja.abrirTurno({
        cajaId: state.cajaId,
        empleadoId: state.empleadoId,
        fondoInicial: parseFloat(fondoInicial) || 100,
      });
      setState({ turnoCajaId: result.id });
      setTurno(result);
      notify('✅ Turno abierto', 'success');
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMovimiento = async () => {
    const importe = parseFloat(movImporte);
    if (!importe || !movConcepto.trim()) {
      notify('Completa importe y concepto', 'error');
      return;
    }
    try {
      await api.caja.movimiento({
        turnoCajaId: state.turnoCajaId!,
        tipo: movTipo,
        importe,
        concepto: movConcepto.trim(),
      });
      notify(`${movTipo === 'entrada' ? '📥' : '📤'} Movimiento registrado`, 'success');
      setMovImporte('');
      setMovConcepto('');
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const handleCerrarTurno = async () => {
    const conteo = parseFloat(conteoEfectivo);
    if (!conteo && conteo !== 0) {
      notify('Introduce el conteo de efectivo', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await api.caja.cerrar({
        turnoCajaId: state.turnoCajaId!,
        conteoEfectivo: conteo,
      });
      setTurno(null);
      setState({ turnoCajaId: '' });
      setConteoEfectivo('');
      const descuadre = result.descuadre ?? 0;
      notify(
        `Turno cerrado${descuadre !== 0 ? ` — Descuadre: ${Number(descuadre).toFixed(2)} €` : ' — Sin descuadre ✅'}`,
        descuadre !== 0 ? 'error' : 'success',
      );
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>🏦 Gestión de Caja</h2>

      {!turnoActivo ? (
        /* --- Panel Abrir Turno --- */
        <div className="card" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔐</div>
            <h3>No hay turno abierto</h3>
            <p style={{ color: '#64748b' }}>Abre un turno para empezar a cobrar</p>
          </div>

          <div className="form-group">
            <label className="form-label">Fondo inicial (€)</label>
            <input
              className="form-input"
              type="number"
              value={fondoInicial}
              onChange={(e) => setFondoInicial(e.target.value)}
              style={{ fontSize: '1.3rem', textAlign: 'right' }}
            />
          </div>

          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={handleAbrirTurno}
            disabled={loading}
          >
            {loading ? '⏳ Abriendo...' : '🔓 Abrir Turno'}
          </button>
        </div>
      ) : (
        /* --- Panel Turno Activo --- */
        <>
          <div className="caja-stats">
            <div className="stat-card">
              <div className="stat-label">Estado</div>
              <div className="stat-value" style={{ color: '#16a34a' }}>✅ Turno Activo</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Fondo Inicial</div>
              <div className="stat-value">{Number(turno?.fondoInicial ?? fondoInicial).toFixed(2)} €</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">ID Turno</div>
              <div className="stat-value" style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                {state.turnoCajaId?.substring(0, 12)}…
              </div>
            </div>
          </div>

          {/* Registrar movimiento */}
          <div className="card" style={{ marginBottom: 20, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>📋 Registrar Movimiento</h3>

            <div className="pago-metodo" style={{ marginBottom: 16 }}>
              <div
                className={`pago-btn ${movTipo === 'entrada' ? 'selected' : ''}`}
                onClick={() => setMovTipo('entrada')}
              >
                <div className="icon">📥</div>
                <div>Entrada</div>
              </div>
              <div
                className={`pago-btn ${movTipo === 'salida' ? 'selected' : ''}`}
                onClick={() => setMovTipo('salida')}
              >
                <div className="icon">📤</div>
                <div>Salida</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Importe (€)</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                value={movImporte}
                onChange={(e) => setMovImporte(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Concepto</label>
              <input
                className="form-input"
                value={movConcepto}
                onChange={(e) => setMovConcepto(e.target.value)}
                placeholder="Ej: Cambio de caja, proveedor..."
              />
            </div>

            <button className="btn btn-primary" onClick={handleMovimiento}>
              Registrar Movimiento
            </button>
          </div>

          {/* Cerrar turno */}
          <div className="card" style={{ padding: 24, border: '2px solid #ef4444' }}>
            <h3 style={{ marginBottom: 16, color: '#ef4444' }}>🔒 Cerrar Turno</h3>

            <div className="form-group">
              <label className="form-label">Conteo de efectivo en caja (€)</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                value={conteoEfectivo}
                onChange={(e) => setConteoEfectivo(e.target.value)}
                style={{ fontSize: '1.3rem', textAlign: 'right' }}
                placeholder="Cuenta el efectivo..."
              />
            </div>

            <button
              className="btn btn-danger btn-block btn-lg"
              onClick={handleCerrarTurno}
              disabled={loading}
            >
              {loading ? '⏳ Cerrando...' : '🔒 Cerrar Turno'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
