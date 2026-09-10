/**
 * M0-PLATFORM — AuthContext
 * Gestión de sesión JWT: login PIN, login password, logout.
 * (HU-M0-ROL-001, HU-M0-ROL-002, HU-M0-ROL-004)
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RolEmpleado =
  | 'ADMIN'
  | 'GERENTE'
  | 'CAJERO'
  | 'CAMARERO'
  | 'COCINERO'
  | 'BARRA'
  | 'CONTABLE';

export interface AuthUser {
  empleadoId: string;
  nombre: string;
  rol: RolEmpleado;
  establecimientoId: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  loginPin: (establecimientoId: string, pin: string) => Promise<void>;
  loginPassword: (emailLogin: string, password: string) => Promise<void>;
  logout: () => void;
  /** Verifica si el usuario tiene al menos uno de los roles */
  hasRole: (...roles: RolEmpleado[]) => boolean;
}

// ─── Módulos visibles por rol (HU-M0-ROL-004) ────────────────────────────────

export const MODULOS_POR_ROL: Record<RolEmpleado, string[]> = {
  ADMIN:    ['M1', 'M2', 'M3', 'M4'],
  GERENTE:  ['M1', 'M2', 'M3', 'M4'],
  CAJERO:   ['M1'],
  CAMARERO: ['M1'],
  COCINERO: ['M1'],
  BARRA:    ['M1'],
  CONTABLE: ['M3'],
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>(null!);

const TOKEN_KEY = 'gastroflow_jwt';

function decodePayload(token: string): AuthUser | null {
  try {
    const b64 = token.split('.')[1];
    const json = JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));
    if (!json.sub || !json.rol || !json.establecimientoId) return null;
    // Verificar expiración
    if (json.exp && json.exp * 1000 < Date.now()) return null;
    return {
      empleadoId: json.sub,
      nombre: json.nombre ?? '',
      rol: json.rol as RolEmpleado,
      establecimientoId: json.establecimientoId,
    };
  } catch {
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    // Invalidar si el payload ya expiró
    return decodePayload(stored) ? stored : null;
  });

  const user = token ? decodePayload(token) : null;

  // Auto-logout al expirar el token
  useEffect(() => {
    if (!token) return;
    const payload = decodePayload(token);
    if (!payload) { setToken(null); return; }

    const raw = token.split('.')[1];
    const json = JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')));
    if (!json.exp) return;
    const msLeft = json.exp * 1000 - Date.now();
    if (msLeft <= 0) { setToken(null); return; }
    const timer = setTimeout(() => setToken(null), msLeft);
    return () => clearTimeout(timer);
  }, [token]);

  const saveToken = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }, []);

  const loginPin = useCallback(async (establecimientoId: string, pin: string) => {
    const res = await fetch('/api/v1/auth/login-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ establecimientoId, pin }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'PIN incorrecto');
    }
    const data: { accessToken: string } = await res.json();
    saveToken(data.accessToken);
  }, [saveToken]);

  const loginPassword = useCallback(async (emailLogin: string, password: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailLogin, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Credenciales inválidas');
    }
    const data: { accessToken: string } = await res.json();
    saveToken(data.accessToken);
  }, [saveToken]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const hasRole = useCallback((...roles: RolEmpleado[]) => {
    if (!user) return false;
    return roles.includes(user.rol);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loginPin,
        loginPassword,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
