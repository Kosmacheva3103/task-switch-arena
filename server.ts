import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { matchManager } from './src/server/game/matchManager';
import type { Rule } from './src/server/game/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Подготовка Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Создание HTTP сервера
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Настройка Socket.io
  const io = new SocketIOServer(httpServer, {
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

      // Добавляем игрока в матч
      matchManager.addPlayer(matchId, {
        id: playerId,
        name: playerName,
        rating: 1000,
        isBot: false,
        individualScore: 0,
        errors: 0,
      });

      const match = matchManager.getMatch(matchId);
      if (match) {
        const totalPlayers =
          match.teams[0].players.length + match.teams[1].players.length;

        io.to(`match:${matchId}`).emit('player_joined', {
          playerId,
          playerName,
          playerCount: totalPlayers,
          maxPlayers: 6,
        });

        console.log(`${playerName} присоединился к матчу ${matchId} (${totalPlayers}/6)`);
      }
    });

    // Запуск матча
    socket.on('start_match', (data: { matchId: string }) => {
      const { matchId } = data;
      const match = matchManager.startMatch(matchId);

      if (match) {
        io.to(`match:${matchId}`).emit('match_started', {
          teams: match.teams.map((t) => ({
            id: t.id,
            name: t.name,
            players: t.players.map((p) => ({
              id: p.id,
              name: p.name,
              rating: p.rating,
              isBot: p.isBot,
            })),
          })),
          countdown: 3,
        });

        // Запуск игрового цикла
        startGameLoop(matchId, io);
      }
    });

    // Ответ игрока
    socket.on(
      'submit_answer',
      (data: { matchId: string; answer: boolean; responseTimeMs: number }) => {
        const { matchId, answer, responseTimeMs } = data;
        const playerId = socket.data.playerId;

        const result = matchManager.submitAnswer(
          matchId,
          playerId,
          answer,
          responseTimeMs
        );

        socket.emit('answer_result', {
          accepted: result.accepted,
          correct: result.correct,
          points: result.points,
          message: result.message,
        });
      }
    );

    // Отключение
    socket.on('disconnect', () => {
      console.log('Игрок отключился:', socket.id);
      const matchId = socket.data.matchId;
      if (matchId) {
        matchManager.removePlayer(matchId, socket.data.playerId);
        io.to(`match:${matchId}`).emit('player_left', {
          playerId: socket.data.playerId,
          playerName: socket.data.playerName,
        });
      }
    });
  });

  // Запуск сервера
  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io готов к подключениям`);
  });
});

// Игровой цикл
function startGameLoop(matchId: string, io: SocketIOServer) {
  let roundNumber = 0;
  const maxRounds = 15;

  const runRound = () => {
    const match = matchManager.nextRound(matchId);
    if (!match) return;

    roundNumber = match.roundNumber;

    const duration = 5000 + Math.floor(Math.random() * 10000);

    io.to(`match:${matchId}`).emit('rule_changed', {
      rule: match.currentRule,
      ruleDisplay: getRuleName(match.currentRule as Rule),
      symbol: match.currentSymbol,
      roundNumber: match.roundNumber,
      maxRounds: match.maxRounds,
      timeLimit: duration,
      buttons: getButtons(match.currentRule as Rule),
    });

    // Обработка ответов ботов
    processBotAnswers(matchId, io);

    // Таймер на конец раунда
    setTimeout(() => {
      const currentMatch = matchManager.getMatch(matchId);
      if (!currentMatch || currentMatch.status !== 'active') return;

      io.to(`match:${matchId}`).emit('round_result', {
        roundNumber: currentMatch.roundNumber,
        teamScores: {
          teamA: currentMatch.teams[0].totalScore,
          teamB: currentMatch.teams[1].totalScore,
        },
      });

      if (roundNumber >= maxRounds) {
        endGame(matchId, io);
      } else {
        setTimeout(runRound, 2000); // Пауза 2 секунды между раундами
      }
    }, duration);
  };

  // Первый раунд через 3 секунды после старта
  setTimeout(runRound, 3000);
}

// Обработка ботов
function processBotAnswers(matchId: string, io: SocketIOServer) {
  const match = matchManager.getMatch(matchId);
  if (!match) return;

  for (const team of match.teams) {
    for (const player of team.players) {
      if (player.isBot) {
        const botAnswer = matchManager.getBotAnswer(matchId, player.id);
        if (botAnswer) {
          setTimeout(() => {
            matchManager.submitAnswer(
              matchId,
              player.id,
              botAnswer.answer,
              botAnswer.delay
            );
          }, botAnswer.delay);
        }
      }
    }
  }
}

// Завершение игры
function endGame(matchId: string, io: SocketIOServer) {
  matchManager.endMatch(matchId);
  const match = matchManager.getMatch(matchId);
  const winner = matchManager.getWinner(matchId);

  io.to(`match:${matchId}`).emit('match_ended', {
    winner: winner ? { id: winner.id, name: winner.name } : null,
    isDraw: !winner,
    finalScores: {
      teamA: match?.teams[0].totalScore || 0,
      teamB: match?.teams[1].totalScore || 0,
    },
    teams: match?.teams.map((t) => ({
      name: t.name,
      players: t.players.map((p) => ({
        name: p.name,
        individualScore: p.individualScore,
        errors: p.errors,
      })),
    })),
  });
}

// Вспомогательные функции
function getRuleName(rule: Rule): string {
  const names: Record<Rule, string> = {
    EVEN_ODD: 'Чётное?',
    VOWEL_CONSONANT: 'Гласная?',
    MULTIPLE_OF_THREE: 'Кратно 3?',
  };
  return names[rule];
}

function getButtons(rule: Rule): [string, string] {
  const buttons: Record<Rule, [string, string]> = {
    EVEN_ODD: ['Чётное', 'Нечётное'],
    VOWEL_CONSONANT: ['Гласная', 'Согласная'],
    MULTIPLE_OF_THREE: ['Да', 'Нет'],
  };
  return buttons[rule];
}