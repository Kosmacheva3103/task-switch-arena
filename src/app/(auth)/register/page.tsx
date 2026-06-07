'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result && 'error' in result && result.error) {
        const err = result.error as { message?: string };
        setError(err.message || JSON.stringify(result.error));
      } else {
        router.push('/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Регистрация</h1>
        <p className="text-gray-500 mb-6">Создайте аккаунт в TaskSwitch Arena</p>

        {error && <div className="form-error">{error}</div>}

        <div className="mb-4">
          <label className="form-label">Имя</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Ваше имя" required minLength={2} />
        </div>

        <div className="mb-4">
          <label className="form-label">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" required />
        </div>

        <div className="mb-6">
          <label className="form-label">Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="Минимум 8 символов" required minLength={8} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>

        <p className="text-center text-gray-500 mt-4">
          Уже есть аккаунт?{' '}
          <a href="/login" className="text-indigo-500 hover:underline font-medium">Войти</a>
        </p>
      </form>
    </main>
  );
}