import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Таблица пользователей
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  rating: integer('rating').default(1000).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Таблица матчей
export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: text('status', { enum: ['waiting', 'active', 'finished'] })
    .default('waiting')
    .notNull(),
  currentRule: text('current_rule'),
  maxRounds: integer('max_rounds').default(15).notNull(),
  winnerTeamId: uuid('winner_team_id'),
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Таблица команд
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id')
    .references(() => matches.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  totalScore: integer('total_score').default(0).notNull(),
});

// Таблица игроков в матче
export const matchPlayers = pgTable(
  'match_players',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id')
      .references(() => matches.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    teamId: uuid('team_id')
      .references(() => teams.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    isBot: boolean('is_bot').default(false).notNull(),
    individualScore: integer('individual_score').default(0).notNull(),
    errors: integer('errors').default(0).notNull(),
  },
  (table) => ({
    uniquePlayerInMatch: uniqueIndex('unique_player_in_match').on(
      table.matchId,
      table.userId
    ),
  })
);

// Таблица раундов
export const rounds = pgTable('rounds', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id')
    .references(() => matches.id, { onDelete: 'cascade' })
    .notNull(),
  playerId: uuid('player_id')
    .references(() => matchPlayers.id, { onDelete: 'cascade' })
    .notNull(),
  roundNumber: integer('round_number').notNull(),
  rule: text('rule').notNull(),
  symbol: text('symbol').notNull(),
  playerAnswer: boolean('player_answer'),
  correctAnswer: boolean('correct_answer').notNull(),
  wasCorrect: boolean('was_correct').notNull(),
  points: integer('points').default(0).notNull(),
  responseTimeMs: integer('response_time_ms').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});