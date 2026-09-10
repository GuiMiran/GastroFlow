import { useState, useEffect } from 'react';
import { api } from '../api';
import { useApp } from '../hooks/useApp';

type Tab = 'productos' | 'categorias' | 'ingredientes';

const TIPOS_IVA = [
  { value: 'reducido_10', label: '10% Reducido (alimentos)' },
  { value: 'general_21', label: '21% General (bebidas alcohólicas)' },
  { value: 'superreducido_4', label: '4% Superreducido' },
  { value: 'exento_0', label: '0% Exento' },
];

export function CatalogoPage() {
  const { state, notify } = useApp();
  const [tab, setTab] = useState<Tab>('productos');

  // ── Datos ──────────────────────────────────────────────────
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Modales ────────────────────────────────────────────────
  const [modalProducto, setModalProducto] = useState(false);
  const [editProducto, setEditProducto] = useState<any | null>(null);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalIngrediente, setModalIngrediente] = useState(false);

  // ── Forms ──────────────────────────────────────────────────
  const [fpNombre, setFpNombre] = useState('');
  const [fpDescripcion, setFpDescripcion] = useState('');
  const [fpPrecio, setFpPrecio] = useState('');
  const [fpIva, setFpIva] = useState('reducido_10');
  const [fpCatId, setFpCatId] = useState('');

  const [fcNombre, setFcNombre] = useState('');
  const [fcDestino, setFcDestino] = useState('');
  const [fcOrden, setFcOrden] = useState('0');

  const [fiNombre, setFiNombre] = useState('');
  const [fiUnidad, setFiUnidad] = useState('kg');
  const [fiCoste, setFiCoste] = useState('');
  const [fiMinimo, setFiMinimo] = useState('0');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prods, cats, ings] = await Promise.all([
        api.catalogo.listarProductos(state.establecimientoId),
        api.catalogo.listarCategorias(),
        api.catalogo.listarIngredientes(),
      ]);
      setProductos(prods);
      setCategorias(cats);
      setIngredientes(ings);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Handlers Producto ──────────────────────────────────────
  const abrirNuevoProducto = () => {
    setEditProducto(null);
    setFpNombre(''); setFpDescripcion(''); setFpPrecio('');
    setFpIva('reducido_10'); setFpCatId(categorias[0]?.id ?? '');
    setModalProducto(true);
  };

  const abrirEditProducto = (p: any) => {
    setEditProducto(p);
    setFpNombre(p.nombre); setFpDescripcion(p.descripcion ?? '');
    setFpPrecio(String(p.precioConIva)); setFpIva(p.tipoIva);
    setFpCatId(p.categoriaId);
    setModalProducto(true);
  };

  const guardarProducto = async () => {
    try {
      if (editProducto) {
        await api.catalogo.actualizarProducto(editProducto.id, {
          nombre: fpNombre, precioConIva: parseFloat(fpPrecio),
          tipoIva: fpIva, categoriaId: fpCatId,
        });
        notify('Producto actualizado', 'success');
      } else {
        await api.catalogo.crearProducto({
          establecimientoId: state.establecimientoId,
          nombre: fpNombre, descripcion: fpDescripcion || undefined,
          precioConIva: parseFloat(fpPrecio), tipoIva: fpIva, categoriaId: fpCatId,
        });
        notify('Producto creado', 'success');
      }
      setModalProducto(false);
      loadAll();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const desactivarProducto = async (id: string) => {
    try {
      await api.catalogo.actualizarProducto(id, { activo: false });
      notify('Producto desactivado', 'success');
      loadAll();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  // ── Handlers Categoría ─────────────────────────────────────
  const guardarCategoria = async () => {
    try {
      await api.catalogo.crearCategoria({
        nombre: fcNombre,
        destino: fcDestino || undefined,
        orden: parseInt(fcOrden) || 0,
      });
      notify('Categoría creada', 'success');
      setModalCategoria(false);
      setFcNombre(''); setFcDestino(''); setFcOrden('0');
      loadAll();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  // ── Handlers Ingrediente ───────────────────────────────────
  const guardarIngrediente = async () => {
    try {
      await api.catalogo.crearIngrediente({
        nombre: fiNombre, unidadMedida: fiUnidad,
        precioCoste: parseFloat(fiCoste), stockMinimo: parseFloat(fiMinimo) || 0,
      });
      notify('Ingrediente creado', 'success');
      setModalIngrediente(false);
      setFiNombre(''); setFiUnidad('kg'); setFiCoste(''); setFiMinimo('0');
      loadAll();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Cargando catálogo...</div>;

  const tivaLabel = (v: string) => TIPOS_IVA.find((t) => t.value === v)?.label ?? v;

  return (
    <div>
      <h2>📦 Catálogo</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        {(['productos', 'categorias', 'ingredientes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', border: 'none', cursor: 'pointer',
              background: tab === t ? '#3b82f6' : 'transparent',
              color: tab === t ? '#fff' : '#64748b',
              borderRadius: '6px 6px 0 0', fontWeight: 600, fontSize: '0.9rem',
            }}
          >
            {t === 'productos' ? `🍽️ Productos (${productos.length})` : t === 'categorias' ? `🗂️ Categorías (${categorias.length})` : `🥬 Ingredientes (${ingredientes.length})`}
          </button>
        ))}
      </div>

      {/* ── PRODUCTOS ── */}
      {tab === 'productos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={abrirNuevoProducto}>+ Nuevo Producto</button>
          </div>
          {productos.length === 0
            ? <div className="empty-state"><div className="icon">📭</div>No hay productos</div>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {['Nombre', 'Categoría', 'Precio', 'IVA', 'Acciones'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.nombre}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{p.categoria?.nombre ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#059669' }}>{Number(p.precioConIva).toFixed(2)}€</td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.8rem' }}>{tivaLabel(p.tipoIva)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: '0.8rem' }} onClick={() => abrirEditProducto(p)}>✏️ Editar</button>
                          <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => desactivarProducto(p.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </>
      )}

      {/* ── CATEGORÍAS ── */}
      {tab === 'categorias' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={() => setModalCategoria(true)}>+ Nueva Categoría</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {categorias.map((c) => (
              <div key={c.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                {c.destino && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>📍 {c.destino}</div>}
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>Orden: {c.orden}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── INGREDIENTES ── */}
      {tab === 'ingredientes' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={() => setModalIngrediente(true)}>+ Nuevo Ingrediente</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Nombre', 'Unidad', 'Coste/ud', 'Stock mín.'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredientes.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{i.nombre}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{i.unidadMedida}</td>
                  <td style={{ padding: '10px 12px' }}>{Number(i.precioCoste).toFixed(3)}€</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{Number(i.stockMinimo).toFixed(2)}</td>
                </tr>
              ))}
              {ingredientes.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No hay ingredientes</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {/* ══ Modal Producto ══ */}
      {modalProducto && (
        <div className="modal-overlay" onClick={() => setModalProducto(false)}>
          <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{editProducto ? 'Editar Producto' : 'Nuevo Producto'}</div>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-input" value={fpNombre} onChange={(e) => setFpNombre(e.target.value)} />
            </div>
            {!editProducto && (
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input className="form-input" value={fpDescripcion} onChange={(e) => setFpDescripcion(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Precio con IVA (€) *</label>
              <input className="form-input" type="number" step="0.01" value={fpPrecio} onChange={(e) => setFpPrecio(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo IVA *</label>
              <select className="form-input" value={fpIva} onChange={(e) => setFpIva(e.target.value)}>
                {TIPOS_IVA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select className="form-input" value={fpCatId} onChange={(e) => setFpCatId(e.target.value)}>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModalProducto(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarProducto} disabled={!fpNombre || !fpPrecio || !fpCatId}>
                {editProducto ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Categoría ══ */}
      {modalCategoria && (
        <div className="modal-overlay" onClick={() => setModalCategoria(false)}>
          <div className="modal" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Nueva Categoría</div>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-input" value={fcNombre} onChange={(e) => setFcNombre(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Destino (COCINA / BARRA / DIRECTO)</label>
              <input className="form-input" placeholder="Opcional" value={fcDestino} onChange={(e) => setFcDestino(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Orden</label>
              <input className="form-input" type="number" value={fcOrden} onChange={(e) => setFcOrden(e.target.value)} />
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModalCategoria(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarCategoria} disabled={!fcNombre}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Ingrediente ══ */}
      {modalIngrediente && (
        <div className="modal-overlay" onClick={() => setModalIngrediente(false)}>
          <div className="modal" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Nuevo Ingrediente</div>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-input" value={fiNombre} onChange={(e) => setFiNombre(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Unidad de medida *</label>
              <select className="form-input" value={fiUnidad} onChange={(e) => setFiUnidad(e.target.value)}>
                {['kg', 'g', 'l', 'ml', 'ud', 'ración'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Precio coste / ud (€) *</label>
              <input className="form-input" type="number" step="0.001" value={fiCoste} onChange={(e) => setFiCoste(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Stock mínimo</label>
              <input className="form-input" type="number" step="0.01" value={fiMinimo} onChange={(e) => setFiMinimo(e.target.value)} />
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModalIngrediente(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarIngrediente} disabled={!fiNombre || !fiCoste}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
