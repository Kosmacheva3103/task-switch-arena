import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Проверка наличия DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL не задан в .env файле');
}

// Создание подключения
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Максимум соединений
  idle_timeout: 20, // Таймаут простоя
});

// Создание экземпляра Drizzle
export const db = drizzle(client, { schema });

// Экспорт схемы
export * from './schema';