// Подсчёт индивидуальных очков за раунд
export function calculateRoundScore(responseTimeMs: number, wasCorrect: boolean): number {
  if (!wasCorrect) return 0;
  
  const BASE_POINTS = 10;
  const TIME_BONUS_MAX = 15;
  const timeBonus = Math.max(0, TIME_BONUS_MAX - Math.floor(responseTimeMs / 100));
  
  return BASE_POINTS + timeBonus;
}

// Штраф команде за ошибку игрока
export function getTeamPenalty(): number {
  return -5;
}

// Штраф за отсутствие ответа
export function getNoAnswerPenalty(): number {
  return -3;
}

// Расчёт командного счёта
export function calculateTeamScore(
  individualScores: number[],
  errorCount: number,
  noAnswerCount: number = 0
): number {
  const totalIndividual = individualScores.reduce((sum, score) => sum + score, 0);
  const penalty = errorCount * getTeamPenalty();
  const noAnswerPenalty = noAnswerCount * getNoAnswerPenalty();
  return totalIndividual + penalty + noAnswerPenalty;
}

// Расчёт очков с детализацией для UI
export function getScoreBreakdown(responseTimeMs: number, wasCorrect: boolean): {
  basePoints: number;
  timeBonus: number;
  total: number;
} {
  if (!wasCorrect) {
    return { basePoints: 0, timeBonus: 0, total: 0 };
  }
  
  const BASE_POINTS = 10;
  const TIME_BONUS_MAX = 15;
  const timeBonus = Math.max(0, TIME_BONUS_MAX - Math.floor(responseTimeMs / 100));
  
  return {
    basePoints: BASE_POINTS,
    timeBonus,
    total: BASE_POINTS + timeBonus,
  };
}