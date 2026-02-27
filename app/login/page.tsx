'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.logo}>MERLIN</div>
        <p style={styles.subtitle}>Enter the access code to continue</p>

        <input
          type="password"
          placeholder="Access code"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoFocus
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading || !password} style={styles.button}>
          {loading ? 'Verifying…' : 'Enter'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0b0e14',
    fontFamily: 'var(--font-montserrat), system-ui, sans-serif',
  },
  card: {
    background: '#161b26',
    border: '1px solid #2a3040',
    borderRadius: '12px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  logo: {
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '6px',
    color: '#4fc3f7',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#8892a4',
    textAlign: 'center',
    margin: '0 0 8px',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #2a3040',
    background: '#0b0e14',
    color: '#e0e6f0',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    color: '#ef5350',
    fontSize: '13px',
    margin: 0,
    textAlign: 'center',
  },
  button: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#4fc3f7',
    color: '#0b0e14',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
};
