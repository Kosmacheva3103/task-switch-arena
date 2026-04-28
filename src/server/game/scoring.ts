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

// Расчёт командного счёта
export function calculateTeamScore(
  individualScores: number[],
  errorCount: number
): number {
  const totalIndividual = individualScores.reduce((sum, score) => sum + score, 0);
  const penalty = errorCount * getTeamPenalty();
  return totalIndividual + penalty;
}