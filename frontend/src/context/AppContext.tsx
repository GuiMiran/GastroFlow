import React, { createContext, useReducer, useState, useCallback } from 'react';
import type { Order, Invoice } from '../utils/accounting';

// ─── State shape ─────────────────────────────────────────────────

interface SessionState {
  establecimientoId: string;
  empleadoId: string;
  empleadoNombre: string;
  cajaId: string;
  turnoCajaId: string | null;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface AppState {
  session: SessionState;
  orders: Order[];
  invoices: Invoice[];
  notification: Notification | null;
}

// ─── Actions ─────────────────────────────────────────────────────

export type AppAction =
  | { type: 'SET_SESSION'; payload: Partial<SessionState> }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: string } }
  | { type: 'ASSIGN_CUSTOMER'; payload: { orderId: string; customerId: string } }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'SET_NOTIFICATION'; payload: Notification }
  | { type: 'CLEAR_NOTIFICATION' };

// ─── Reducer ─────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: { ...state.session, ...action.payload } };

    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };

    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o,
        ),
      };

    case 'ASSIGN_CUSTOMER':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.orderId ? { ...o, customerId: action.payload.customerId } : o,
        ),
      };

    case 'ADD_INVOICE':
      return {
        ...state,
        invoices: [...state.invoices, action.payload],
        orders: state.orders.map((o) =>
          o.id === action.payload.orderId ? { ...o, status: 'invoiced' } : o,
        ),
      };

    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };

    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };

    default:
      return state;
  }
}

// ─── Initial state ───────────────────────────────────────────────

const initialState: AppState = {
  session: {
    establecimientoId: '',
    empleadoId: '',
    empleadoNombre: '',
    cajaId: '',
    turnoCajaId: null,
  },
  orders: [],
  invoices: [],
  notification: null,
};

// ─── Context ─────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AppContextType {
  /* legacy surface kept for existing pages */
  state: AppState['session'];
  setState: (patch: Partial<AppState['session']>) => void;

  /* new reducer-based state */
  appState: AppState;
  dispatch: React.Dispatch<AppAction>;

  /* toast helpers */
  toasts: Toast[];
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AppContext = createContext<AppContextType>(null!);

// ─── Provider ────────────────────────────────────────────────────

const SESSION_KEY = 'gastroflow_session';

function loadSession(): AppState['session'] {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return { ...initialState.session, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return initialState.session;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [appState, dispatch] = useReducer(appReducer, {
    ...initialState,
    session: loadSession(),
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Also sets reducer notification + 3 s auto-clear
    dispatch({ type: 'SET_NOTIFICATION', payload: { type, message } });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      dispatch({ type: 'CLEAR_NOTIFICATION' });
    }, 3500);
  }, []);

  // Legacy helpers so existing pages keep working unchanged
  const setSession = useCallback(
    (patch: Partial<AppState['session']>) => {
      dispatch({ type: 'SET_SESSION', payload: patch });
      // Persist updated session so it survives page refreshes
      const next = { ...appState.session, ...patch };
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    },
    [appState.session],
  );

  return (
    <AppContext.Provider
      value={{
        state: appState.session,
        setState: setSession,
        appState,
        dispatch,
        toasts,
        notify,
      }}
    >
      {children}
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </AppContext.Provider>
  );
}
