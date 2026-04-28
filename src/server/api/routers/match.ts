import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { matchManager } from '../../game/matchManager';
import { nanoid } from 'nanoid';

export const matchRouter = router({
  // Создание нового матча
  createMatch: publicProcedure
    .input(
      z.object({
        playerName: z.string().min(1).max(30),
      })
    )
    .mutation(async ({ input }) => {
      const { matchId, inviteCode } = matchManager.createMatch();
      
      // Добавляем создателя как первого игрока
      matchManager.addPlayer(matchId, {
        id: nanoid(),
        name: input.playerName,
        rating: 1000, // Стартовый рейтинг
        isBot: false,
        individualScore: 0,
        errors: 0,
      });
      
      return { matchId, inviteCode };
    }),

  // Присоединение к матчу
  joinMatch: publicProcedure
    .input(
      z.object({
        matchId: z.string().min(1),
        playerName: z.string().min(1).max(30),
      })
    )
    .mutation(async ({ input }) => {
      const match = matchManager.getMatch(input.matchId);
      
      if (!match) {
        throw new Error('MATCH_NOT_FOUND');
      }
      
      if (match.status !== 'waiting') {
        throw new Error('MATCH_ALREADY_STARTED');
      }
      
      const totalPlayers = match.teams[0].players.length + match.teams[1].players.length;
      if (totalPlayers >= 6) {
        throw new Error('MATCH_FULL');
      }
      
      const success = matchManager.addPlayer(input.matchId, {
        id: nanoid(),
        name: input.playerName,
        rating: 1000,
        isBot: false,
        individualScore: 0,
        errors: 0,
      });
      
      return { success };
    }),

  // Получение информации о матче
  getMatch: publicProcedure
    .input(
      z.object({
        matchId: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const match = matchManager.getMatch(input.matchId);
      
      if (!match) {
        throw new Error('MATCH_NOT_FOUND');
      }
      
      const totalPlayers = match.teams[0].players.length + match.teams[1].players.length;
      
      return {
        matchId: match.matchId,
        status: match.status,
        playerCount: totalPlayers,
        maxPlayers: 6,
        teams: match.teams.map(t => ({
          name: t.name,
          players: t.players.map(p => ({
            name: p.name,
            isBot: p.isBot,
          })),
        })),
        createdAt: match.createdAt,
      };
    }),

  // Запуск матча
  startMatch: publicProcedure
    .input(
      z.object({
        matchId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const match = matchManager.startMatch(input.matchId);
      
      if (!match) {
        throw new Error('Невозможно запустить матч');
      }
      
      return {
        matchId: match.matchId,
        status: match.status,
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
      };
    }),
});