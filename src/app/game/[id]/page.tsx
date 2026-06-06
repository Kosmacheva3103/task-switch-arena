'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { connectSocket, getSocket } from '@/lib/socket';
import Button from '@/components/ui/Button';
import Timer from '@/components/ui/Timer';

interface GameData {
  rule: string;
  ruleDisplay: string;
  symbol: string;
  roundNumber: number;
  maxRounds: number;
  timeLimit: number;
  buttons: [string, string];
}

interface TeamData {
  id: string;
  name: string;
  players: {
    id: string;
    name: string;
    rating: number;
    isBot: boolean;
  }[];
}

interface MatchStartedData {
  teams: [TeamData, TeamData];
  countdown: number;
}

interface AnswerResultData {
  accepted: boolean;
  correct: boolean;
  points: number;
  message?: string;
}

interface RoundResultData {
  roundNumber: number;
  teamScores: {
    teamA: number;
    teamB: number;
  };
}

interface MatchEndedData {
  winner: { id: string; name: string } | null;
  isDraw: boolean;
  finalScores: {
    teamA: number;
    teamB: number;
  };
  teams: {
    name: string;
    players: {
      name: string;
      individualScore: number;
      errors: number;
    }[];
  }[];
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [teamA, setTeamA] = useState<TeamData | null>(null);
  const [teamB, setTeamB] = useState<TeamData | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('match_started', (data: MatchStartedData) => {
      setTeamA(data.teams[0]);
      setTeamB(data.teams[1]);
      setGameStarted(true);
    });

    socket.on('rule_changed', (data: GameData) => {
      setGameData(data);
      setAnswered(false);
      setAnswerResult('');
      setGameStarted(true);
    });

    socket.on('answer_result', (data: AnswerResultData) => {
      setAnswerResult(data.correct ? `✅ +${data.points} очков` : '❌ 0 очков');
    });

    socket.on('round_result', (data: RoundResultData) => {
      setScoreA(data.teamScores.teamA);
      setScoreB(data.teamScores.teamB);
    });

    socket.on('match_ended', (data: MatchEndedData) => {
      localStorage.setItem('lastMatchResults', JSON.stringify(data));
      router.push(`/results/${matchId}`);
    });

    return () => {
      socket.off('match_started');
      socket.off('rule_changed');
      socket.off('answer_result');
      socket.off('round_result');
      socket.off('match_ended');
    };
  }, [matchId, router]);

  const handleAnswer = (answer: boolean) => {
    if (answered) return;
    setAnswered(true);

    const socket = getSocket();
    socket.emit('submit_answer', {
      matchId,
      answer,
      responseTimeMs: 500,
    });
  };

  if (!gameStarted) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-2xl">Ожидание начала матча...</p>
        </div>
      </main>
    );
  }

  if (!gameData) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-4 text-white">
        <div className="text-center">
          <p className="text-sm text-gray-400">{teamA?.name}</p>
          <p className="text-3xl font-bold">{scoreA}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Раунд</p>
          <p className="text-2xl font-bold">{gameData.roundNumber}/{gameData.maxRounds}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">{teamB?.name}</p>
          <p className="text-3xl font-bold">{scoreB}</p>
        </div>
      </div>

      <div className="bg-indigo-500 text-white text-center py-3 rounded-xl mb-4">
        <p className="text-xl font-bold">{gameData.ruleDisplay}</p>
      </div>

      <div className="mb-6">
        <Timer seconds={Math.floor(gameData.timeLimit / 1000)} />
      </div>

      <div className="bg-gray-800 rounded-2xl p-8 mb-6 text-center">
        <span className="text-[120px] font-bold text-white">{gameData.symbol}</span>
      </div>

      {answerResult && (
        <div className="text-center text-xl font-bold mb-4 text-white">{answerResult}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => handleAnswer(true)}
          disabled={answered}
          variant="primary"
          size="lg"
          className="h-24 text-2xl"
        >
          {gameData.buttons[0]}
        </Button>
        <Button
          onClick={() => handleAnswer(false)}
          disabled={answered}
          variant="danger"
          size="lg"
          className="h-24 text-2xl"
        >
          {gameData.buttons[1]}
        </Button>
      </div>
    </main>
  );
}