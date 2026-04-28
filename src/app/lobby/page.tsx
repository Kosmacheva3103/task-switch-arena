'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { connectSocket, getSocket } from '@/lib/socket';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function LobbyPage() {
  const router = useRouter();
  const [matchId, setMatchId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [code, setCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Создание комнаты
  const createRoom = () => {
    if (!playerName.trim()) {
      setError('Введите имя');
      return;
    }

    const newMatchId = nanoid(12);
    const inviteCode = nanoid(6).toUpperCase();
    const playerId = nanoid();

    setMatchId(newMatchId);
    setCreatedCode(inviteCode);

    // Сохраняем данные
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('matchId', newMatchId);

    // Подключаемся к Socket.io
    const socket = connectSocket();
    socket.emit('join_match', { matchId: newMatchId, playerId, playerName });

    // Слушаем присоединения
    socket.on('player_joined', (data) => {
      setPlayers((prev) => [...prev, data.playerName]);
    });

    setPlayers([playerName]);
  };

  // Присоединение к комнате
  const joinRoom = () => {
    if (!playerName.trim() || !code.trim()) {
      setError('Введите имя и код комнаты');
      return;
    }

    const playerId = nanoid();
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('matchId', code);

    const socket = connectSocket();
    socket.emit('join_match', { matchId: code, playerId, playerName });

    socket.on('player_joined', (data) => {
      setPlayers((prev) => [...prev, data.playerName]);
    });

    setMatchId(code);
    setPlayers([playerName]);
  };

  // Начать игру
  const startGame = () => {
    const socket = getSocket();
    socket.emit('start_match', { matchId });
    router.push(`/game/${matchId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🎮 Лобби
        </h1>

        {error && (
          <div className="bg-red-500/20 text-white p-4 rounded-xl mb-4">{error}</div>
        )}

        {!matchId ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Создать комнату */}
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

            {/* Присоединиться */}
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
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Код комнаты"
                className="w-full bg-gray-100 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button onClick={joinRoom} variant="secondary" className="w-full">
                Присоединиться
              </Button>
            </Card>
          </div>
        ) : (
          <Card className="text-center">
            {createdCode && (
              <div className="mb-6">
                <p className="text-gray-500 mb-2">Код комнаты:</p>
                <p className="text-5xl font-mono font-bold text-indigo-500 tracking-widest">
                  {createdCode}
                </p>
                <p className="text-gray-400 mt-2">Отправьте этот код друзьям</p>
              </div>
            )}

            <h3 className="text-xl font-bold mb-4">
              Игроки ({players.length}/6)
            </h3>
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

            <Button onClick={startGame} disabled={players.length < 2} size="lg">
              {players.length < 2 ? 'Минимум 2 игрока' : 'Начать игру'}
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
}
