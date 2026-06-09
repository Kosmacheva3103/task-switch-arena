'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectSocket } from '@/lib/socket';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface PlayerResult {
  name: string;
  individualScore: number;
  errors: number;
}

interface TeamResult {
  name: string;
  players: PlayerResult[];
}

interface MatchEndedData {
  winner: { id: string; name: string } | null;
  isDraw: boolean;
  finalScores: { teamA: number; teamB: number };
  teams: TeamResult[];
  ratingChanges?: { teamA: number; teamB: number };
}

function getInitialResults(): MatchEndedData | null {
  if (typeof window === 'undefined') return null;
  const saved = sessionStorage.getItem('matchResults');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as MatchEndedData;
    if (parsed.teams?.length > 0) {
      sessionStorage.removeItem('matchResults');
      return parsed;
    }
  } catch {}
  return null;
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<MatchEndedData | null>(getInitialResults);

  useEffect(() => {
    if (results) return;

    const socket = connectSocket();

    socket.on('match_ended', (data: MatchEndedData) => {
      if (data.teams?.length > 0) {
        setResults(data);
      }
    });

    return () => {
      socket.off('match_ended');
    };
  });

  if (!results) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-2xl">Загрузка результатов...</p>
        </div>
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
          {results.teams.map((team, i) => (
            <Card key={i}>
              <h3 className="text-xl font-bold text-center mb-4">{team.name}</h3>
              <p className="text-4xl font-bold text-center text-indigo-500 mb-4">
                {results.finalScores[`team${i === 0 ? 'A' : 'B'}` as keyof typeof results.finalScores]}
              </p>
              <div className="space-y-2">
                {team.players.map((player, j) => (
                  <div key={j} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="font-medium text-gray-900">{player.name}</span>
                    <span className="text-sm text-gray-700">
                      {player.individualScore} очков
                      {player.errors > 0 && (
                        <span className="text-red-500 ml-2">({player.errors} ошибок)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        {results.ratingChanges && (
          <div className="text-center text-white/80 mb-8">
            <p className="text-lg">
              Изменение рейтинга: 
              <span className="text-green-300 ml-2">
                Команда А: {results.ratingChanges.teamA > 0 ? '+' : ''}{results.ratingChanges.teamA}
              </span>
              <span className="text-red-300 ml-4">
                Команда Б: {results.ratingChanges.teamB > 0 ? '+' : ''}{results.ratingChanges.teamB}
              </span>
            </p>
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/lobby')} size="lg">
            Играть ещё
          </Button>
        </div>
      </div>
    </main>
  );
}