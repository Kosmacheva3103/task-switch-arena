'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  userName: string;
  rating?: number;
}

export default function UserMenu({ userName, rating }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition"
      >
        <span className="text-lg">👤</span>
        <span>{userName}</span>
        {rating !== undefined && (
          <span className="text-yellow-300 text-sm">🏆 {rating}</span>
        )}
        <span className="text-xs">▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg py-2 w-56 z-50">
            <div className="px-4 py-2 text-gray-500 text-sm border-b">
              {userName}
              {rating !== undefined && (
                <span className="text-yellow-500 ml-2">🏆 {rating}</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 transition"
            >
              Выйти
            </button>
          </div>
        </>
      )}
    </div>
  );
}