// Типы правил классификации
export type Rule = 'EVEN_ODD' | 'VOWEL_CONSONANT' | 'MULTIPLE_OF_THREE';

// Игрок
export interface Player {
  id: string;
  name: string;
  rating: number;
  isBot: boolean;
  individualScore: number;
  errors: number;
  userId?: string;
}

// Команда
export interface Team {
  id: string;
  name: string;
  players: Player[];
  totalScore: number;
}

// Результат раунда для одного игрока
export interface RoundResult {
  playerId: string;
  playerName: string;
  symbol: string;
  playerAnswer: boolean | null;
  correctAnswer: boolean;
  wasCorrect: boolean;
  points: number;
  responseTimeMs: number;
}

// Состояние игры
export interface GameState {
  matchId: string;
  status: 'waiting' | 'active' | 'finished';
  currentRule: Rule | null;
  currentSymbol: string | null;
  roundNumber: number;
  maxRounds: number;
  teams: [Team, Team];
  timeRemaining: number;
  roundResults: RoundResult[];
  createdAt: string;
}