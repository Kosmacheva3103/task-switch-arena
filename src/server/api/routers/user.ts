import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { auth } from '../../auth';

export const userRouter = router({
  getMe: publicProcedure
    .query(async ({ ctx }) => {
      // Используем контекст tRPC (сессия уже должна быть там)
      const session = (ctx as any).session;
      
      if (!session || !session.user) {
        return { userId: null, name: null };
      }

      return {
        userId: session.user.id,
        name: session.user.name,
      };
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => ({
      id: input.userId,
      name: 'Игрок',
      rating: 1000,
      totalMatches: 0,
      wins: 0,
    })),

  getLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => ({
      leaderboard: [
        { rank: 1, name: 'Alice', rating: 1450 },
        { rank: 2, name: 'Bob', rating: 1420 },
        { rank: 3, name: 'Carol', rating: 1380 },
      ].slice(0, input.limit),
    })),
});