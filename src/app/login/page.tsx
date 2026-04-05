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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error === 'Invalid password' ? 'Contraseña incorrecta' : (data.error || 'Error al iniciar sesión'));
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e1117]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 bg-[#161b22] border border-[#30363d] rounded-lg"
      >
        <h1 className="text-xl font-semibold text-[#e6edf3] mb-6">VybePM</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          className="w-full px-3 py-2 bg-[#0e1117] border border-[#30363d] rounded text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] mb-4"
        />
        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-[#238636] text-white rounded font-medium hover:bg-[#2ea043] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
