'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { connectSocket, getSocket } from '@/lib/socket';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import UserMenu from '@/components/ui/UserMenu';

interface PlayerJoinedData {
  playerId: string;
  playerName: string;
  playerCount: number;
  maxPlayers: number;
  allPlayers: string[];
}

async function fetchUserId(): Promise<string | null> {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    console.log('fetchUserId result:', data.userId);
    return data.userId || null;
  } catch {
    return null;
  }
}

export default function LobbyPage() {
  const router = useRouter();
  const [matchId, setMatchId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'waiting'>('select');
  const [userName, setUserName] = useState('Гость');
  const [rating, setRating] = useState<number | undefined>(undefined);

useEffect(() => {
  fetch('/api/me')
    .then(r => r.json())
    .then(data => {
      if (data.name) {
        setUserName(data.name);
        setPlayerName(data.name);
      }
      if (data.rating !== undefined) {
        setRating(data.rating);
      }
    })
    .catch(() => {});
}, []);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('player_joined', (data: PlayerJoinedData) => {
      if (data.allPlayers) setPlayers(data.allPlayers);
    });

    socket.on('match_started', () => router.push(`/game/${matchId}`));

    socket.on('error_message', (msg: string) => {
      setError(msg);
      setMode('select');
    });

    return () => {
      socket.off('player_joined');
      socket.off('match_started');
      socket.off('error_message');
    };
  }, [matchId, router]);

  const createRoom = async () => {
    if (!playerName.trim()) {
      setError('Введите имя');
      return;
    }

    const userId = await fetchUserId();
    const roomCode = nanoid(8).toUpperCase();
    const playerId = nanoid();

    setMatchId(roomCode);
    setCreatedCode(roomCode);
    setMode('waiting');
    console.log('userId перед emit:', userId);
    console.log('Отправляемые данные:', { matchId: roomCode, playerId, playerName, userId, action: 'create' });
    getSocket().emit('join_match', {
      matchId: roomCode,
      playerId,
      playerName,
      userId,
      action: 'create',
    });

    setPlayers([playerName]);
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !joinCode.trim()) {
      setError('Введите имя и код комнаты');
      return;
    }

    const userId = await fetchUserId();
    const playerId = nanoid();

    setMatchId(joinCode);
    setMode('waiting');
    console.log('userId перед emit:', userId);
    console.log('Отправляемые данные:', { matchId: matchId, playerId, playerName, userId, action: 'create' });
    getSocket().emit('join_match', {
      matchId: joinCode,
      playerId,
      playerName,
      userId,
      action: 'join',
    });

    setPlayers([playerName]);
  };
  
  const startGame = () => {
    getSocket().emit('start_match', { matchId });
    router.push(`/game/${matchId}`);
  };

  const copyCode = () => {
    const code = createdCode || matchId;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">🎮 Лобби</h1>
          <UserMenu userName={userName} rating={rating} />
        </div>

        {error && (
          <div className="bg-red-500/20 text-white p-4 rounded-xl mb-4 cursor-pointer" onClick={() => setError('')}>
            {error}
          </div>
        )}

        {mode === 'select' && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <h2 className="text-2xl font-bold mb-4">Создать комнату</h2>
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Ваше имя" className="form-input" />
              <div className="mt-4"><Button onClick={createRoom} className="w-full">Создать</Button></div>
            </Card>
            <Card>
              <h2 className="text-2xl font-bold mb-4">Присоединиться</h2>
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Ваше имя" className="form-input mb-4" />
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Код комнаты" className="form-input" />
              <div className="mt-4"><Button onClick={joinRoom} variant="secondary" className="w-full">Присоединиться</Button></div>
            </Card>
          </div>
        )}

        {mode === 'waiting' && (
          <Card className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ожидание игроков</h2>
            <div className="mb-6">
              <p className="text-gray-500 mb-2">Код комнаты:</p>
              <p className="text-5xl font-mono font-bold text-indigo-500 tracking-widest cursor-pointer hover:bg-indigo-50 rounded-xl py-2" onClick={copyCode}>
                {createdCode || matchId}
              </p>
              <p className={`mt-2 text-sm ${copied ? 'text-green-500' : 'text-gray-400'}`}>
                {copied ? '✅ Скопировано!' : 'Нажмите на код, чтобы скопировать'}
              </p>
            </div>
            <h3 className="text-xl font-bold mb-4">Игроки ({players.length}/6)</h3>
            <div className="space-y-2 mb-6">
              {players.map((name, i) => (
                <div key={i} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium">{name}</div>
              ))}
            </div>
            <Button onClick={startGame} size="lg" className="w-full">Начать игру ({players.length} игроков)</Button>
          </Card>
        )}
      </div>
    </main>
  );
}