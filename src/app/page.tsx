import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">🧠 TaskSwitch Arena</h1>
        <p className="text-2xl mb-8">Командный тренажёр переключения задач</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-50 transition"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="bg-indigo-700 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-indigo-800 transition border-2 border-white/30"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </main>
  );
}