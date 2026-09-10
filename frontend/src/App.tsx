import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { SalaPage } from './pages/SalaPage';
import { ComandaPage } from './pages/ComandaPage';
import { CobroPage } from './pages/CobroPage';
import { CajaPage } from './pages/CajaPage';
import { KdsPage } from './pages/KdsPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { EmpleadosPage } from './pages/EmpleadosPage';
import { ComprasPage } from './pages/ComprasPage';
import { InventarioPage } from './pages/InventarioPage';
import FiscalPage from './pages/FiscalPage';
import ContablePage from './pages/ContablePage';
import FacturasPage from './pages/FacturasPage';
import InvoicesPage from './pages/InvoicesPage';

/** Redirige a /login si no hay sesión activa (HU-M0-ROL-004 AC-05) */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          {/* Público */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupPage />} />

          {/* KDS: pantalla dedicada sin sidebar, requiere auth */}
          <Route
            path="/kds/:destino"
            element={
              <RequireAuth>
                <KdsPage />
              </RequireAuth>
            }
          />
          <Route path="/kds" element={<Navigate to="/kds/cocina" replace />} />

          {/* Rutas protegidas con sidebar */}
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/sala" element={<SalaPage />} />
            <Route path="/comanda/:servicioId" element={<ComandaPage />} />
            <Route path="/cobro/:servicioId" element={<CobroPage />} />
            <Route path="/caja" element={<CajaPage />} />
            <Route path="/caja/facturas" element={<FacturasPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            {/* M2 Backoffice */}
            <Route path="/backoffice/catalogo" element={<CatalogoPage />} />
            <Route path="/backoffice/empleados" element={<EmpleadosPage />} />
            <Route path="/backoffice/compras" element={<ComprasPage />} />
            <Route path="/backoffice/inventario" element={<InventarioPage />} />
            <Route path="/backoffice" element={<Navigate to="/backoffice/catalogo" replace />} />
            {/* M3 Contabilidad */}
            <Route path="/contabilidad/fiscal" element={<FiscalPage />} />
            <Route path="/contabilidad/contable" element={<ContablePage />} />
            <Route path="/contabilidad" element={<Navigate to="/contabilidad/fiscal" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  );
}

