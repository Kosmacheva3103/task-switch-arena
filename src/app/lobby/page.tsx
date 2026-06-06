'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { connectSocket, getSocket } from '@/lib/socket';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface PlayerJoinedData {
  playerId: string;
  playerName: string;
  playerCount: number;
  maxPlayers: number;
  allPlayers: string[];
}

interface MatchStartedData {
  teams: {
    id: string;
    name: string;
    players: {
      id: string;
      name: string;
      rating: number;
      isBot: boolean;
    }[];
  }[];
  countdown: number;
}

export default function LobbyPage() {
  const router = useRouter();
  const [matchId, setMatchId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'waiting'>('select');

  useEffect(() => {
    const socket = connectSocket();

    socket.on('player_joined', (data: PlayerJoinedData) => {
      if (data.allPlayers) {
        setPlayers(data.allPlayers);
      }
    });

    socket.on('match_started', () => {
      router.push(`/game/${matchId}`);
    });

    return () => {
      socket.off('player_joined');
      socket.off('match_started');
    };
  }, [matchId, router]);

  const createRoom = () => {
    if (!playerName.trim()) {
      setError('Введите имя');
      return;
    }

    const roomCode = nanoid(8).toUpperCase();
    const playerId = nanoid();

    setMatchId(roomCode);
    setCreatedCode(roomCode);
    setMode('waiting');

    localStorage.setItem('playerId', playerId);
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('matchId', roomCode);

    const socket = getSocket();
    socket.emit('join_match', {
      matchId: roomCode,
      playerId,
      playerName,
    });

    setPlayers([playerName]);
  };

  const joinRoom = () => {
    if (!playerName.trim() || !joinCode.trim()) {
      setError('Введите имя и код комнаты');
      return;
    }

    const playerId = nanoid();

    localStorage.setItem('playerId', playerId);
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('matchId', joinCode);

    setMatchId(joinCode);
    setMode('waiting');

    const socket = getSocket();
    socket.emit('join_match', {
      matchId: joinCode,
      playerId,
      playerName,
    });

    setPlayers([playerName]);
  };

  const startGame = () => {
    const socket = getSocket();
    socket.emit('start_match', { matchId });
    router.push(`/game/${matchId}`);
  };

  const copyCode = () => {
    const code = createdCode || matchId;
    navigator.clipboard.writeText(code).catch(() => {});
    alert('Код скопирован!');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">🎮 Лобби</h1>

        {error && (
          <div
            className="bg-red-500/20 text-white p-4 rounded-xl mb-4 cursor-pointer"
            onClick={() => setError('')}
          >
            {error} (нажмите чтобы скрыть)
          </div>
        )}

        {mode === 'select' && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <h2 className="text-2xl font-bold mb-4">Создать комнату</h2>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full bg-gray-100 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button onClick={createRoom} className="w-full">
                Создать
              </Button>
            </Card>

            <Card>
              <h2 className="text-2xl font-bold mb-4">Присоединиться</h2>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full bg-gray-100 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Код комнаты"
                className="w-full bg-gray-100 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button onClick={joinRoom} variant="secondary" className="w-full">
                Присоединиться
              </Button>
            </Card>
          </div>
        )}

        {mode === 'waiting' && (
          <Card className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ожидание игроков</h2>

            <div className="mb-6">
              <p className="text-gray-500 mb-2">Код комнаты:</p>
              <p
                className="text-5xl font-mono font-bold text-indigo-500 tracking-widest cursor-pointer hover:bg-indigo-50 rounded-xl py-2"
                onClick={copyCode}
              >
                {createdCode || matchId}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Нажмите на код, чтобы скопировать</p>
            </div>

            <h3 className="text-xl font-bold mb-4">Игроки ({players.length}/6)</h3>
            <div className="space-y-2 mb-6">
              {players.map((name, i) => (
                <div
                  key={i}
                  className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium"
                >
                  {name}
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-gray-400">Ожидание игроков...</p>
              )}
            </div>

            <Button onClick={startGame} size="lg" className="w-full">
              Начать игру ({players.length} игроков)
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
}