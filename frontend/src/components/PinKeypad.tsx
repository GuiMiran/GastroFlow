/**
 * M0-PLATFORM — PinKeypad
 * Teclado numérico de pantalla para login rápido PIN (HU-M0-ROL-001)
 */
import { useState } from 'react';

interface PinKeypadProps {
  onSubmit: (pin: string) => void;
  error?: string;
  loading?: boolean;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','←','0','✔'];
const PIN_LENGTH = 4;

export function PinKeypad({ onSubmit, error, loading }: PinKeypadProps) {
  const [pin, setPin] = useState('');

  const handleKey = (k: string) => {
    if (loading) return;
    if (k === '←') {
      setPin(p => p.slice(0, -1));
    } else if (k === '✔') {
      if (pin.length === PIN_LENGTH) {
        onSubmit(pin);
        setPin('');
      }
    } else if (pin.length < PIN_LENGTH) {
      const next = pin + k;
      setPin(next);
      if (next.length === PIN_LENGTH) {
        onSubmit(next);
        setPin('');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* PIN dots */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid #475569',
              background: i < pin.length ? '#3b82f6' : 'transparent',
              transition: 'background 0.1s',
            }}
          />
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {KEYS.map(k => (
          <button
            key={k}
            onClick={() => handleKey(k)}
            disabled={loading}
            style={{
              width: 72,
              height: 72,
              fontSize: '1.4rem',
              fontWeight: 700,
              borderRadius: 12,
              border: '1px solid #334155',
              background: k === '✔' ? '#3b82f6' : k === '←' ? '#475569' : '#1e293b',
              color: '#f1f5f9',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {k}
          </button>
        ))}
      </div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 4, textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
}
