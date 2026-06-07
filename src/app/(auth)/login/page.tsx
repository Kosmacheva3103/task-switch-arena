'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authClient.signIn.email({ email, password });
    if (result && 'error' in result && result.error) {
      const err = result.error as { message?: string };
      setError(err.message || JSON.stringify(result.error));
    } else {
        router.push('/lobby');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Вход</h1>
        <p className="text-gray-500 mb-6">Войдите в TaskSwitch Arena</p>

        {error && <div className="form-error">{error}</div>}

        <div className="mb-4">
          <label className="form-label">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" required />
        </div>

        <div className="mb-6">
          <label className="form-label">Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Вход...' : 'Войти'}
        </button>

        <p className="text-center text-gray-500 mt-4">
          Нет аккаунта?{' '}
          <a href="/register" className="text-indigo-500 hover:underline font-medium">Зарегистрироваться</a>
        </p>
      </form>
    </main>
  );
}