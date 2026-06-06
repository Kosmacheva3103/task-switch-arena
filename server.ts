import { createServer } from 'http';
import 'dotenv/config';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { matchManager } from './src/server/game/matchManager';
import type { Rule } from './src/server/game/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error:', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('join_match', (data: { matchId: string; playerId: string; playerName: string }) => {
      const { matchId, playerId, playerName } = data;
      socket.join(`match:${matchId}`);
      socket.data.matchId = matchId;
      socket.data.playerId = playerId;

      let added = matchManager.addPlayer(matchId, {
        id: playerId, name: playerName, rating: 1000,
        isBot: false, individualScore: 0, errors: 0,
      });

      if (!added) {
        matchManager.createMatchById(matchId);
        matchManager.addPlayer(matchId, {
          id: playerId, name: playerName, rating: 1000,
          isBot: false, individualScore: 0, errors: 0,
        });
      }

      const match = matchManager.getMatch(matchId);
      if (match) {
        const allPlayers = [
          ...match.teams[0].players.map(p => p.name),
          ...match.teams[1].players.map(p => p.name),
        ];
        io.to(`match:${matchId}`).emit('player_joined', {
          playerId, playerName,
          playerCount: allPlayers.length, maxPlayers: 6, allPlayers,
        });
      }
    });

    socket.on('start_match', (data: { matchId: string }) => {
      const match = matchManager.startMatch(data.matchId);
      if (match) {
        io.to(`match:${data.matchId}`).emit('match_started', {
          teams: match.teams.map(t => ({
            id: t.id, name: t.name,
            players: t.players.map(p => ({
              id: p.id, name: p.name, rating: p.rating, isBot: p.isBot,
            })),
          })),
          countdown: 3,
        });
        startGameLoop(data.matchId, io);
      }
    });

    socket.on('submit_answer', (data: { matchId: string; answer: boolean; responseTimeMs: number }) => {
      const result = matchManager.submitAnswer(data.matchId, socket.data.playerId, data.answer, data.responseTimeMs);
      socket.emit('answer_result', {
        accepted: result.accepted, correct: result.correct,
        points: result.points, message: result.message,
      });
    });

    socket.on('disconnect', () => {
      if (socket.data.matchId) {
        matchManager.removePlayer(socket.data.matchId, socket.data.playerId);
        io.to(`match:${socket.data.matchId}`).emit('player_left', {
          playerId: socket.data.playerId,
        });
      }
    });
  });

  httpServer.listen(port, () => {});
});

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

    processBotAnswers(matchId, io);

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
        setTimeout(runRound, 2000);
      }
    }, duration);
  };

  setTimeout(runRound, 3000);
}

function processBotAnswers(matchId: string, io: SocketIOServer) {
  const match = matchManager.getMatch(matchId);
  if (!match) return;
  for (const team of match.teams) {
    for (const player of team.players) {
      if (player.isBot) {
        const botAnswer = matchManager.getBotAnswer(matchId, player.id);
        if (botAnswer) {
          setTimeout(() => {
            matchManager.submitAnswer(matchId, player.id, botAnswer.answer, botAnswer.delay);
          }, botAnswer.delay);
        }
      }
    }
  }
}

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
    teams: match?.teams.map(t => ({
      name: t.name,
      players: t.players.map(p => ({
        name: p.name,
        individualScore: p.individualScore,
        errors: p.errors,
      })),
    })),
  });
}

function getRuleName(rule: Rule): string {
  const names: Record<Rule, string> = {
    EVEN_ODD: 'Чётное?', VOWEL_CONSONANT: 'Гласная?', MULTIPLE_OF_THREE: 'Кратно 3?',
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