import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, MODULOS_POR_ROL } from '../context/AuthContext';
import { useApp } from '../hooks/useApp';

export function Layout() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { state } = useApp();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const modulosActivos = user ? MODULOS_POR_ROL[user.rol] : [];
  const canM1 = modulosActivos.includes('M1');
  const canM2 = modulosActivos.includes('M2');
  const canM3 = modulosActivos.includes('M3');
  const canCaja = hasRole('ADMIN', 'GERENTE', 'CAJERO');

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">🍽️ GastroFlow</div>
        <nav className="sidebar-nav">
          {/* M1 — TPV/Sala */}
          {canM1 && (
            <>
              <NavLink to="/sala" className={({ isActive }) => isActive ? 'active' : ''}>
                🗺️ Sala / Mesas
              </NavLink>
              <NavLink to="/kds/cocina" className={({ isActive }) => isActive ? 'active' : ''}>
                🍳 KDS Cocina
              </NavLink>
              <NavLink to="/kds/barra" className={({ isActive }) => isActive ? 'active' : ''}>
                🍺 KDS Barra
              </NavLink>
              {canCaja && (
                <>
                  <NavLink to="/caja" className={({ isActive }) => isActive ? 'active' : ''}>
                    💰 Caja
                  </NavLink>
                  <NavLink to="/caja/facturas" className={({ isActive }) => isActive ? 'active' : ''}>
                    🧾 Facturas del día
                  </NavLink>
                  <NavLink to="/invoices" className={({ isActive }) => isActive ? 'active' : ''}>
                    🧾 Facturas
                  </NavLink>
                </>
              )}
            </>
          )}

          {/* M2 — Backoffice */}
          {canM2 && (
            <>
              <div style={{ margin: '16px 0 8px', padding: '0 20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>
                Backoffice
              </div>
              <NavLink to="/backoffice/catalogo" className={({ isActive }) => isActive ? 'active' : ''}>
                📦 Catálogo
              </NavLink>
              {hasRole('ADMIN', 'GERENTE') && (
                <NavLink to="/backoffice/empleados" className={({ isActive }) => isActive ? 'active' : ''}>
                  👥 Empleados
                </NavLink>
              )}
              <NavLink to="/backoffice/compras" className={({ isActive }) => isActive ? 'active' : ''}>
                🛒 Compras
              </NavLink>
              <NavLink to="/backoffice/inventario" className={({ isActive }) => isActive ? 'active' : ''}>
                📊 Inventario
              </NavLink>
            </>
          )}

          {/* M3 — Contabilidad */}
          {canM3 && (
            <>
              <div style={{ margin: '16px 0 8px', padding: '0 20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>
                Contabilidad
              </div>
              <NavLink to="/contabilidad/fiscal" className={({ isActive }) => isActive ? 'active' : ''}>
                📋 Fiscal / IVA
              </NavLink>
              <NavLink to="/contabilidad/contable" className={({ isActive }) => isActive ? 'active' : ''}>
                📒 Contabilidad
              </NavLink>
            </>
          )}
        </nav>

        {/* Footer: usuario + logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8 }}>
            👤 {user?.nombre} <span style={{ color: '#475569' }}>({user?.rol})</span>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: 8,
              border: '1px solid #334155',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="spectra-watermark" aria-hidden="true">SPECTRA | SDD DEMO</div>
        <header className="topbar">
          <h1>{state.establecimientoId ? 'GastroFlow TPV' : 'Bar El Rincón'}</h1>
          <div className="topbar-info">
            <span>📅 {new Date().toLocaleDateString('es-ES')}</span>
            <span>🕐 {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

