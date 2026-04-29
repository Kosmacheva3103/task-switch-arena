import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';

const sqlite = new Database('auth.db');

export const auth = betterAuth({
  database: sqlite,
  emailAndPassword: {
    enabled: true,
  },
});