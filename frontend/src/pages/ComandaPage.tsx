import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../hooks/useApp';

interface Categoria {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  nombre: string;
  precioConIva: number;
  tipoIva: string;
  categoriaId: string;
}

interface LineaLocal {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  modificadores: string[];
}

const MODIFICADORES_PRESET = [
  'Sin cebolla', 'Sin gluten', 'Sin sal', 'Sin hielo',
  'Poco hecho', 'Muy hecho', 'Al punto', 'Doble', 'Extra',
];

export function ComandaPage() {
  const { servicioId } = useParams<{ servicioId: string }>();
  const { state, notify } = useApp();
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [catActiva, setCatActiva] = useState<string | null>(null);
  const [lineas, setLineas] = useState<LineaLocal[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [lineaEditando, setLineaEditando] = useState<string | null>(null);
  const [textoModif, setTextoModif] = useState('');
  const inputModifRef = useRef<HTMLInputElement>(null);

  // Fetch catálogo
  useEffect(() => {
    (async () => {
      try {
        const data = await api.menu.get();
        setCategorias(data.categorias || []);
        setProductos(data.productos || []);
        if (data.categorias?.length) setCatActiva(data.categorias[0].id);
      } catch {
        // Catálogo no disponible
      }
    })();
  }, []);

  const productosFiltrados = catActiva
    ? productos.filter((p) => p.categoriaId === catActiva)
    : productos;

  const agregarProducto = (p: Producto) => {
    setLineas((prev) => {
      const existing = prev.find((l) => l.productoId === p.id);
      if (existing) {
        return prev.map((l) =>
          l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l,
        ) as LineaLocal[];
      }
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: Number(p.precioConIva), cantidad: 1, modificadores: [] }];
    });
  };

  const toggleEditarLinea = (productoId: string) => {
    setLineaEditando((prev) => (prev === productoId ? null : productoId));
    setTextoModif('');
    setTimeout(() => inputModifRef.current?.focus(), 50);
  };

  const agregarModificador = (productoId: string, texto: string) => {
    const t = texto.trim();
    if (!t) return;
    setLineas((prev) =>
      prev.map((l) =>
        l.productoId === productoId && !l.modificadores.includes(t)
          ? { ...l, modificadores: [...l.modificadores, t] }
          : l,
      ),
    );
    setTextoModif('');
  };

  const eliminarModificador = (productoId: string, texto: string) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.productoId === productoId
          ? { ...l, modificadores: l.modificadores.filter((m) => m !== texto) }
          : l,
      ),
    );
  };

  const cambiarCantidad = (productoId: string, delta: number) => {
    setLineas((prev) =>
      prev
        .map((l) => (l.productoId === productoId ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0),
    );
  };

  const total = lineas.reduce((sum, l) => sum + l.precio * l.cantidad, 0);

  const enviarComanda = async () => {
    if (!lineas.length) {
      notify('Añade productos a la comanda', 'error');
      return;
    }
    setEnviando(true);
    try {
      await api.comandas.tomar({
        servicioId: servicioId!,
        camareroId: state.empleadoId,
        lineas: lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          modificadores: l.modificadores.length ? l.modificadores : undefined,
        })),
      });
      notify('✅ Comanda enviada a cocina/barra', 'success');
      setLineas([]);
      setLineaEditando(null);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const irACobrar = () => {
    navigate(`/cobro/${servicioId}`);
  };

  return (
    <div className="tpv-layout">
      {/* Panel izquierdo: catálogo */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.1rem' }}>📝 Comanda</h2>
          <button className="btn btn-outline" onClick={() => navigate('/sala')}>
            ← Volver a Sala
          </button>
        </div>

        {/* Categorías */}
        <div className="categorias-tabs">
          {categorias.map((c) => (
            <button
              key={c.id}
              className={`cat-tab ${catActiva === c.id ? 'active' : ''}`}
              onClick={() => setCatActiva(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {/* Productos */}
        {productosFiltrados.length > 0 ? (
          <div className="productos-grid">
            {productosFiltrados.map((p) => (
              <div key={p.id} className="producto-btn" onClick={() => agregarProducto(p)}>
                <div className="producto-nombre">{p.nombre}</div>
                <div className="producto-precio">{Number(p.precioConIva).toFixed(2)} €</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">📦</div>
            <p>No hay productos cargados.</p>
            <p style={{ fontSize: '0.85rem', marginTop: 8 }}>
              Necesitas un endpoint <code>GET /api/v1/productos/catalogo</code> en el backend.
            </p>
          </div>
        )}
      </div>

      {/* Panel derecho: ticket en curso */}
      <div className="ticket-panel">
        <div className="ticket-header">
          🧾 Ticket — Servicio
        </div>

        <div className="ticket-lines">
          {lineas.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>
              <div className="icon">👆</div>
              <p>Toca un producto para añadirlo</p>
            </div>
          ) : (
            lineas.map((l) => (
              <div key={l.productoId}>
                <div className="ticket-line" style={{ cursor: 'pointer' }} onClick={() => toggleEditarLinea(l.productoId)}>
                  <div className="ticket-line-info">
                    <div className="ticket-line-name">
                      {l.nombre}
                      {l.modificadores.length > 0 && (
                        <span style={{ marginLeft: 4, fontSize: '0.75rem', color: '#94a3b8' }}>
                          ({l.modificadores.length} mod.)
                        </span>
                      )}
                    </div>
                    <div className="ticket-line-detail">
                      {l.cantidad} × {l.precio.toFixed(2)} €
                    </div>
                    {l.modificadores.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {l.modificadores.map((m) => (
                          <span
                            key={m}
                            style={{
                              background: '#1e3a5f',
                              color: '#93c5fd',
                              borderRadius: 4,
                              padding: '1px 6px',
                              fontSize: '0.72rem',
                              fontStyle: 'italic',
                            }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ticket-line-total">
                    {(l.precio * l.cantidad).toFixed(2)} €
                  </div>
                  <div className="ticket-line-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="qty-btn" onClick={() => cambiarCantidad(l.productoId, -1)}>−</button>
                    <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{l.cantidad}</span>
                    <button className="qty-btn" onClick={() => cambiarCantidad(l.productoId, 1)}>+</button>
                  </div>
                </div>

                {/* Panel modificadores inline */}
                {lineaEditando === l.productoId && (
                  <div style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 4,
                  }}>
                    {/* Presets */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {MODIFICADORES_PRESET.map((preset) => {
                        const activo = l.modificadores.includes(preset);
                        return (
                          <button
                            key={preset}
                            onClick={() =>
                              activo
                                ? eliminarModificador(l.productoId, preset)
                                : agregarModificador(l.productoId, preset)
                            }
                            style={{
                              background: activo ? '#1d4ed8' : '#334155',
                              color: activo ? '#fff' : '#cbd5e1',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              fontWeight: activo ? 700 : 400,
                            }}
                          >
                            {activo ? '✓ ' : ''}{preset}
                          </button>
                        );
                      })}
                    </div>

                    {/* Input libre */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        ref={inputModifRef}
                        type="text"
                        value={textoModif}
                        onChange={(e) => setTextoModif(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') agregarModificador(l.productoId, textoModif);
                        }}
                        placeholder="Modificador libre…"
                        style={{
                          flex: 1,
                          background: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: 6,
                          color: '#f1f5f9',
                          padding: '6px 10px',
                          fontSize: '0.85rem',
                        }}
                      />
                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        onClick={() => agregarModificador(l.productoId, textoModif)}
                      >
                        + Añadir
                      </button>
                    </div>

                    {/* Modificadores activos con × */}
                    {l.modificadores.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {l.modificadores.map((m) => (
                          <span
                            key={m}
                            style={{
                              background: '#1e3a5f',
                              color: '#93c5fd',
                              borderRadius: 6,
                              padding: '3px 8px',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            {m}
                            <button
                              onClick={() => eliminarModificador(l.productoId, m)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#93c5fd',
                                cursor: 'pointer',
                                padding: 0,
                                lineHeight: 1,
                                fontSize: '0.9rem',
                              }}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="ticket-footer">
          <div className="ticket-total">
            <span>TOTAL</span>
            <span>{total.toFixed(2)} €</span>
          </div>
          <div className="btn-group" style={{ flexDirection: 'column', gap: 8 }}>
            <button
              className="btn btn-success btn-block btn-lg"
              onClick={enviarComanda}
              disabled={enviando || !lineas.length}
            >
              {enviando ? '⏳ Enviando...' : '📤 Enviar Comanda'}
            </button>
            <button className="btn btn-warning btn-block" onClick={irACobrar}>
              💳 Ir a Cobrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
