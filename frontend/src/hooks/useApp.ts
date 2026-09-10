// ─── useApp ──────────────────────────────────────────────────────
// Must live in its own file — NOT in AppContext.tsx (HMR constraint T-3).

import { useContext } from 'react';
import { AppContext, type AppContextType } from '../context/AppContext';

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
