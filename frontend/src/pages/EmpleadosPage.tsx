import { useState, useEffect } from 'react';
import { api } from '../api';
import { useApp } from '../hooks/useApp';

const PUESTOS = ['camarero', 'cocinero', 'barra', 'supervisor', 'encargado', 'limpieza', 'otro'];

export function EmpleadosPage() {
  const { state, notify } = useApp();
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);

  // form fields
  const [fNombre, setFNombre] = useState('');
  const [fApellidos, setFApellidos] = useState('');
  const [fNif, setFNif] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fTelefono, setFTelefono] = useState('');
  const [fPuesto, setFPuesto] = useState('camarero');

  const loadEmpleados = async () => {
    setLoading(true);
    try {
      setEmpleados(await api.rrhh.listarEmpleados(state.establecimientoId));
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmpleados(); }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setFNombre(''); setFApellidos(''); setFNif(''); setFEmail(''); setFTelefono(''); setFPuesto('camarero');
    setModal(true);
  };

  const abrirEditar = (e: any) => {
    setEditando(e);
    setFNombre(e.nombre); setFApellidos(e.apellidos); setFNif(e.nif);
    setFEmail(e.email ?? ''); setFTelefono(e.telefono ?? ''); setFPuesto(e.puesto);
    setModal(true);
  };

  const guardar = async () => {
    try {
      if (editando) {
        await api.rrhh.actualizarEmpleado(editando.id, {
          nombre: fNombre, apellidos: fApellidos,
          email: fEmail || undefined, telefono: fTelefono || undefined, puesto: fPuesto,
        });
        notify('Empleado actualizado', 'success');
      } else {
        await api.rrhh.crearEmpleado({
          establecimientoId: state.establecimientoId,
          nombre: fNombre, apellidos: fApellidos, nif: fNif,
          email: fEmail || undefined, telefono: fTelefono || undefined, puesto: fPuesto,
        });
        notify('Empleado creado', 'success');
      }
      setModal(false);
      loadEmpleados();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const desactivar = async (id: string) => {
    try {
      await api.rrhh.actualizarEmpleado(id, { activo: false });
      notify('Empleado dado de baja', 'success');
      loadEmpleados();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const fichar = async (empleadoId: string, tipo: 'entrada' | 'salida') => {
    try {
      const r = await api.rrhh.registrarFichaje(empleadoId, tipo);
      notify(
        tipo === 'salida' && r.horasTrabajadas
          ? `Salida registrada — ${r.horasTrabajadas}`
          : `Fichaje ${tipo} registrado`,
        'success',
      );
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Cargando empleados...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>👥 Empleados</h2>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo Empleado</button>
      </div>

      {empleados.length === 0
        ? <div className="empty-state"><div className="icon">📭</div>Sin empleados registrados</div>
        : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Nombre', 'NIF', 'Puesto', 'Email', 'Teléfono', 'Fichaje', 'Acciones'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empleados.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{e.nombre} {e.apellidos}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace' }}>{e.nif}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600 }}>
                      {e.puesto}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{e.email ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{e.telefono ?? '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-success" style={{ padding: '3px 10px', fontSize: '0.8rem' }} onClick={() => fichar(e.id, 'entrada')}>▶ Entrada</button>
                      <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: '0.8rem' }} onClick={() => fichar(e.id, 'salida')}>⏹ Salida</button>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: '0.8rem' }} onClick={() => abrirEditar(e)}>✏️</button>
                      <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => desactivar(e.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{editando ? 'Editar Empleado' : 'Nuevo Empleado'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={fNombre} onChange={(e) => setFNombre(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Apellidos *</label>
                <input className="form-input" value={fApellidos} onChange={(e) => setFApellidos(e.target.value)} />
              </div>
              {!editando && (
                <div className="form-group" style={{ gridColumn: '1/3' }}>
                  <label className="form-label">NIF *</label>
                  <input className="form-input" placeholder="12345678A" value={fNif} onChange={(e) => setFNif(e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={fTelefono} onChange={(e) => setFTelefono(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/3' }}>
                <label className="form-label">Puesto *</label>
                <select className="form-input" value={fPuesto} onChange={(e) => setFPuesto(e.target.value)}>
                  {PUESTOS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={!fNombre || !fApellidos || (!editando && !fNif)}>
                {editando ? 'Guardar cambios' : 'Crear empleado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
