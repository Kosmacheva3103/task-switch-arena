import type { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { matchManager } from '../game/matchManager';
import type { Rule } from '../game/types';

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function initSocketServer(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Игрок подключился:', socket.id);

    // Присоединение к матчу
    socket.on('join_match', (data: { matchId: string; playerId: string; playerName: string }) => {
      const { matchId, playerId, playerName } = data;
      
      socket.join(`match:${matchId}`);
      socket.data.matchId = matchId;
      socket.data.playerId = playerId;
      socket.data.playerName = playerName;

      // Оповещаем всех в комнате о новом игроке
      const match = matchManager.getMatch(matchId);
      if (match) {
        const totalPlayers = match.teams[0].players.length + match.teams[1].players.length;
        io?.to(`match:${matchId}`).emit('player_joined', {
          playerId,
          playerName,
          playerCount: totalPlayers,
          maxPlayers: 6,
        });
      }

      console.log(`${playerName} присоединился к матчу ${matchId}`);
    });

    // Запуск матча
    socket.on('start_match', (data: { matchId: string }) => {
      const { matchId } = data;
      const match = matchManager.startMatch(matchId);

      if (match) {
        io?.to(`match:${matchId}`).emit('match_started', {
          teams: match.teams.map(t => ({
            id: t.id,
            name: t.name,
            players: t.players.map(p => ({
              id: p.id,
              name: p.name,
              rating: p.rating,
              isBot: p.isBot,
            })),
          })),
          countdown: 5,
        });

        // Запускаем первый раунд через 5 секунд
        startRoundTimer(matchId);
      }
    });

    // Ответ игрока
    socket.on('submit_answer', (data: { matchId: string; answer: boolean; responseTimeMs: number }) => {
      const { matchId, answer, responseTimeMs } = data;
      const playerId = socket.data.playerId;

      const result = matchManager.submitAnswer(matchId, playerId, answer, responseTimeMs);

      if (result.accepted) {
        // Отправляем результат игроку
        socket.emit('answer_result', {
          correct: result.correct,
          points: result.points,
        });

        // Проверяем, все ли ответили
        checkAllAnswered(matchId);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      console.log('Игрок отключился:', socket.id);
      const matchId = socket.data.matchId;
      if (matchId) {
        io?.to(`match:${matchId}`).emit('player_left', {
          playerId: socket.data.playerId,
          playerName: socket.data.playerName,
        });
      }
    });
  });

  return io;
}

// Таймер для смены раундов
function startRoundTimer(matchId: string) {
  const match = matchManager.nextRound(matchId);
  if (!match) return;

  const duration = 5000 + Math.floor(Math.random() * 10000); // 5-15 секунд

  // Отправляем новый раунд всем игрокам
  io?.to(`match:${matchId}`).emit('rule_changed', {
    rule: match.currentRule,
    ruleDisplay: getRuleDisplayNameRus(match.currentRule as Rule),
    symbol: match.currentSymbol,
    roundNumber: match.roundNumber,
    maxRounds: match.maxRounds,
    timeLimit: duration,
    buttons: getRuleButtonsRus(match.currentRule as Rule),
  });

  // Устанавливаем таймер на следующий раунд
  setTimeout(() => {
    const currentMatch = matchManager.getMatch(matchId);
    if (currentMatch && currentMatch.status === 'active') {
      // Отправляем результаты раунда
      io?.to(`match:${matchId}`).emit('round_result', {
        roundNumber: currentMatch.roundNumber,
        teamScores: {
          teamA: currentMatch.teams[0].totalScore,
          teamB: currentMatch.teams[1].totalScore,
        },
      });

      // Если матч не закончен — следующий раунд
      if (currentMatch.roundNumber < currentMatch.maxRounds) {
        startRoundTimer(matchId);
      } else {
        endMatchAndNotify(matchId);
      }
    }
  }, duration);
}

// Проверка, все ли ответили
function checkAllAnswered(matchId: string) {
  const match = matchManager.getMatch(matchId);
  if (!match) return;

  const totalPlayers = match.teams[0].players.length + match.teams[1].players.length;
  const answeredCount = match.roundResults.filter(
    r => r.playerAnswer !== null
  ).length;

  // Если все ответили — можно досрочно переходить к следующему раунду
  if (answeredCount >= totalPlayers && totalPlayers > 0) {
    // Досрочное завершение раунда (опционально)
  }
}

// Завершение матча
function endMatchAndNotify(matchId: string) {
  matchManager.endMatch(matchId);
  const match = matchManager.getMatch(matchId);
  const winner = matchManager.getWinner(matchId);
  const ratingChanges = matchManager.calculateRatingChanges(matchId);

  io?.to(`match:${matchId}`).emit('match_ended', {
    winner: winner ? { id: winner.id, name: winner.name } : null,
    isDraw: !winner,
    finalScores: {
      teamA: match?.teams[0].totalScore || 0,
      teamB: match?.teams[1].totalScore || 0,
    },
    ratingChanges,
  });
}

// Вспомогательные функции
function getRuleDisplayNameRus(rule: Rule): string {
  const names: Record<Rule, string> = {
    EVEN_ODD: 'Чётное?',
    VOWEL_CONSONANT: 'Гласная?',
    MULTIPLE_OF_THREE: 'Кратно 3?',
  };
  return names[rule];
}

function getRuleButtonsRus(rule: Rule): [string, string] {
  const buttons: Record<Rule, [string, string]> = {
    EVEN_ODD: ['Чётное', 'Нечётное'],
    VOWEL_CONSONANT: ['Гласная', 'Согласная'],
    MULTIPLE_OF_THREE: ['Да', 'Нет'],
  };
  return buttons[rule];
}