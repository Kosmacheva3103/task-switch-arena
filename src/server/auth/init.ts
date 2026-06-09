import Database from 'better-sqlite3';

const db = new Database('auth.db');

// Удаляем все таблицы
db.exec(`DROP TABLE IF EXISTS account`);
db.exec(`DROP TABLE IF EXISTS session`);
db.exec(`DROP TABLE IF EXISTS user`);
db.exec(`DROP TABLE IF EXISTS verification`);

// Создаём таблицы со ВСЕМИ возможными колонками для Better-auth 1.6.9
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER DEFAULT 0 NOT NULL,
    image TEXT,
    rating INTEGER DEFAULT 1000 NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
    updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES user(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiresAt TEXT NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
    updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES user(id) ON DELETE CASCADE NOT NULL,
    providerId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    password TEXT,
    createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
    updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')) NOT NULL,
    updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
  );
`);
db.close();