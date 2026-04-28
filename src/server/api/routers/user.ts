import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const userRouter = router({
  // Получение профиля пользователя
  getProfile: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      // Пока возвращаем заглушку, позже подключим БД
      return {
        id: input.userId,
        name: 'Игрок',
        rating: 1000,
        totalMatches: 0,
        wins: 0,
      };
    }),

  // Таблица лидеров
  getLeaderboard: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      // Пока заглушка
      return {
        leaderboard: [
          { rank: 1, name: 'Alice', rating: 1450 },
          { rank: 2, name: 'Bob', rating: 1420 },
          { rank: 3, name: 'Carol', rating: 1380 },
        ].slice(0, input.limit),
      };
    }),
});