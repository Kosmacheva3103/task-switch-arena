'use client';

import { useState } from 'react';
import { trpcClient } from '@/lib/trpc-client';

export default function TestTRPCPage() {
  const [result, setResult] = useState<string>('');

  const testCreateMatch = async () => {
    const res = await trpcClient.match.createMatch.mutate({
      playerName: 'TestPlayer',
    });
    setResult(JSON.stringify(res, null, 2));
  };

  const testGetMatch = async () => {
    const res = await trpcClient.match.getMatch.query({
      matchId: 'test',
    });
    setResult(JSON.stringify(res, null, 2));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест tRPC API</h1>
      <div className="flex gap-4 mb-4">
        <button
          onClick={testCreateMatch}
          className="bg-indigo-500 text-white px-4 py-2 rounded"
        >
          Создать матч
        </button>
        <button
          onClick={testGetMatch}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Получить матч
        </button>
      </div>
      <pre className="bg-gray-100 p-4 rounded">{result || 'Нажмите кнопку...'}</pre>
    </div>
  );
}