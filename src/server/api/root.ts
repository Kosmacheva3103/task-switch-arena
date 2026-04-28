import { router } from './trpc';
import { matchRouter } from './routers/match';
import { userRouter } from './routers/user';

export const appRouter = router({
  match: matchRouter,
  user: userRouter,
});

// Экспорт типа для клиента
export type AppRouter = typeof appRouter;