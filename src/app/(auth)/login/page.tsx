'use client';

import { useState } from 'react';
import { authClient } from '@/server/auth/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      setError(result.error.message || 'Ошибка входа');
    } else {
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <form 
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Вход</h1>
        <p className="text-gray-400 mb-6">Войдите в TaskSwitch Arena</p>

        {error && (
          <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-3 rounded-lg font-bold hover:bg-indigo-600 transition mb-4"
        >
          Войти
        </button>

        <p className="text-center text-gray-400">
          Нет аккаунта?{' '}
          <a href="/register" className="text-indigo-400 hover:underline">
            Зарегистрироваться
          </a>
        </p>
      </form>
    </main>
  );
}