/**
 * M0-PLATFORM — LoginPage
 * Pantalla de login: modo PIN (sala) y modo email/password (backoffice).
 * (HU-M0-ROL-001, HU-M0-ROL-002)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../hooks/useApp';
import { PinKeypad } from '../components/PinKeypad';

type Modo = 'pin' | 'password';

// Decodifica el payload del JWT
function decodeJWT(token: string) {
  try {
    const base64 = token.split('.')[1];
    const json = JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')));
    return json;
  } catch {
    return null;
  }
}

export function LoginPage() {
  const [modo, setModo] = useState<Modo>('pin');
  const [establecimientoId, setEstablecimientoId] = useState(
    localStorage.getItem('gastroflow_estId') ?? '',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginPin, loginPassword } = useAuth();
  const { setState } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (establecimientoId) return;

    fetch('/api/v1/setup/info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { establecimiento?: { id: string } | null } | null) => {
        if (data?.establecimiento?.id) {
          setEstablecimientoId(data.establecimiento.id);
        }
      })
      .catch(() => undefined);
  }, [establecimientoId]);

  const handlePin = async (pin: string) => {
    if (!establecimientoId.trim()) {
      setError('Introduce el ID del establecimiento');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Login con PIN
      const res = await fetch('/api/v1/auth/login-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ establecimientoId: establecimientoId.trim(), pin }),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'PIN incorrecto');
      }
      
      const data = await res.json();
      const payload = decodeJWT(data.accessToken);
      
      // Guardar token en AuthContext
      localStorage.setItem('gastroflow_jwt', data.accessToken);
      localStorage.setItem('gastroflow_estId', establecimientoId.trim());
      
      // Actualizar AppContext con datos del JWT
      if (payload) {
        setState({
          establecimientoId: payload.establecimientoId,
          empleadoId: payload.sub,
          empleadoNombre: payload.nombre || '',
        });
      }
      
      // Forzar recarga para que AuthContext actualice
      window.location.href = '/sala';
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error de acceso');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Login con password
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailLogin: email, password }),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Credenciales inválidas');
      }
      
      const data = await res.json();
      const payload = decodeJWT(data.accessToken);
      
      // Guardar token en AuthContext
      localStorage.setItem('gastroflow_jwt', data.accessToken);
      
      // Actualizar AppContext con datos del JWT
      if (payload) {
        setState({
          establecimientoId: payload.establecimientoId,
          empleadoId: payload.sub,
          empleadoNombre: payload.nombre || '',
        });
      }
      
      // Forzar recarga para que AuthContext actualice
      window.location.href = '/sala';
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error de acceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: 20,
          padding: '40px 32px',
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem' }}>🍽️</div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.5rem', margin: '8px 0 0' }}>GastroFlow</h1>
        </div>

        {/* Toggle */}
        <div
          style={{
            display: 'flex',
            background: '#0f172a',
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {(['pin', 'password'] as Modo[]).map(m => (
            <button
              key={m}
              onClick={() => { setModo(m); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: modo === m ? '#3b82f6' : 'transparent',
                color: modo === m ? '#fff' : '#64748b',
                transition: 'background 0.2s',
              }}
            >
              {m === 'pin' ? '🔢 PIN' : '✉️ Email'}
            </button>
          ))}
        </div>

        {/* PIN mode */}
        {modo === 'pin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>
                ID Establecimiento
              </label>
              <input
                value={establecimientoId}
                onChange={e => setEstablecimientoId(e.target.value)}
                placeholder="Cargando establecimiento..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <PinKeypad onSubmit={handlePin} error={error} loading={loading} />
          </div>
        )}

        {/* Password mode */}
        {modo === 'password' && (
          <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="gerente@restaurante.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: loading ? '#334155' : '#3b82f6',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
