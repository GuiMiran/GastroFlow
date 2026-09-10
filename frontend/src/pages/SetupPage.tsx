import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';

interface SetupInfo {
  establecimiento: { id: string; nombre: string } | null;
  empleados: { id: string; nombre: string; puesto: string }[];
  caja: { id: string; nombre: string } | null;
}

/**
 * Pantalla de configuración inicial.
 * En producción sería un login; aquí cargamos los IDs del seed.
 */
export function SetupPage() {
  const { setState, notify } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState<SetupInfo | null>(null);

  const [form, setForm] = useState({
    establecimientoId: '',
    empleadoId: '',
    empleadoNombre: '',
    cajaId: '',
  });

  async function autoDetect() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/setup/info');
      if (!res.ok) throw new Error('Backend no disponible');
      const data: SetupInfo = await res.json();
      if (!data.establecimiento) throw new Error('No hay datos en la BD. Ejecuta el seed primero.');

      setDetected(data);
      const primerEmpleado = data.empleados[0];
      setForm({
        establecimientoId: data.establecimiento.id,
        empleadoId: primerEmpleado?.id ?? '',
        empleadoNombre: primerEmpleado?.nombre ?? '',
        cajaId: data.caja?.id ?? '',
      });
      notify(`Datos de "${data.establecimiento.nombre}" cargados`, 'success');
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : 'Error al autodetectar', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    if (!form.establecimientoId || !form.empleadoId) {
      notify('Rellena al menos Establecimiento y Empleado', 'error');
      return;
    }
    setLoading(true);
    try {
      // Validar que el establecimientoId existe en la BD antes de navegar
      const res = await fetch(`/api/v1/mesas/establecimiento/${form.establecimientoId}/mapa`);
      if (!res.ok) throw new Error(`El establecimiento no existe (HTTP ${res.status})`);
      const zonas = await res.json();
      if (!Array.isArray(zonas) || zonas.length === 0) {
        throw new Error('El ID de establecimiento no tiene zonas. ¿Es correcto? Usa ⚡ Autodetectar.');
      }
      setState({
        establecimientoId: form.establecimientoId,
        empleadoId: form.empleadoId,
        empleadoNombre: form.empleadoNombre || 'Empleado',
        cajaId: form.cajaId,
        turnoCajaId: null,
      });
      notify('Sesión iniciada', 'success');
      navigate('/sala');
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : 'ID de establecimiento inválido', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#1e293b' }}>
      <div className="card" style={{ width: 480, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🍽️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>GastroFlow</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Configuración de sesión TPV</p>
        </div>

        {/* Autodetect */}
        <button
          className="btn btn-primary btn-block"
          style={{ marginBottom: 20 }}
          onClick={autoDetect}
          disabled={loading}
        >
          {loading ? 'Detectando...' : '⚡ Autodetectar desde la BD'}
        </button>

        {/* Selector de empleado si hay múltiples */}
        {detected && detected.empleados.length > 1 && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Empleado</label>
            <select
              className="form-input"
              value={form.empleadoId}
              onChange={(e) => {
                const emp = detected.empleados.find((x) => x.id === e.target.value);
                setForm({ ...form, empleadoId: e.target.value, empleadoNombre: emp?.nombre ?? '' });
              }}
            >
              {detected.empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} ({emp.puesto})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ borderTop: '1px solid #e2e8f0', margin: '16px 0', paddingTop: 16 }}>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 12 }}>O introduce los IDs manualmente:</p>

          <div className="form-group">
            <label className="form-label">ID Establecimiento</label>
            <input
              className="form-input"
              placeholder="UUID del establecimiento"
              value={form.establecimientoId}
              onChange={(e) => setForm({ ...form, establecimientoId: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ID Empleado</label>
            <input
              className="form-input"
              placeholder="UUID del camarero/gerente"
              value={form.empleadoId}
              onChange={(e) => setForm({ ...form, empleadoId: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nombre (para mostrar)</label>
            <input
              className="form-input"
              placeholder="Ej: Ana Martínez"
              value={form.empleadoNombre}
              onChange={(e) => setForm({ ...form, empleadoNombre: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ID Caja (opcional)</label>
            <input
              className="form-input"
              placeholder="UUID de la caja"
              value={form.cajaId}
              onChange={(e) => setForm({ ...form, cajaId: e.target.value })}
            />
          </div>
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={handleStart}>
          Entrar al TPV →
        </button>
      </div>
    </div>
  );
}
