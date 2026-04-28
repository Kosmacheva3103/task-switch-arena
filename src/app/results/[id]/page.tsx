'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSocket, connectSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('match_ended', (data) => {
      setResults(data);
    });

    return () => {
      socket.off('match_ended');
    };
  }, []);

  if (!results) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Загрузка результатов...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center text-white mb-8">
          <h1 className="text-5xl font-bold mb-2">
            {results.isDraw ? '🤝 Ничья!' : `🏆 ${results.winner?.name} победила!`}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {results.teams?.map((team: any, i: number) => (
            <Card key={i}>
              <h3 className="text-xl font-bold text-center mb-4">
                {team.name}
              </h3>
              <p className="text-4xl font-bold text-center text-indigo-500 mb-4">
                {results.finalScores[`team${i === 0 ? 'A' : 'B'}`]}
              </p>
              <div className="space-y-2">
                {team.players.map((player: any, j: number) => (
                  <div
                    key={j}
                    className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm">
                      {player.individualScore} очков
                      {player.errors > 0 && (
                        <span className="text-red-500 ml-2">
                          ({player.errors} ошибок)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/lobby')} size="lg">
            Играть ещё
          </Button>
        </div>
      </div>
    </main>
  );
}
