import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

// Контекст tRPC (пока пустой, позже добавим сессии)
export const createTRPCContext = async () => {
  return {};
};

// Инициализация tRPC
const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Публичная процедура (доступна без авторизации)
export const publicProcedure = t.procedure;

// Защищённая процедура (только для авторизованных)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // Пока пропускаем всех, позже добавим проверку сессии
  return next({ ctx: { ...ctx } });
});

// Экспорт роутера
export const router = t.router;
export const middleware = t.middleware;