/**
 * Расчёт изменения рейтинга по системе Эло
 */
export function calculateEloChange(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  K: number = 32
): { teamA: number; teamB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const deltaA = Math.round(K * (scoreA - expectedA));
  
  return {
    teamA: deltaA,
    teamB: -deltaA,
  };
}

/**
 * Расчёт среднего рейтинга команды
 */
export function calculateTeamRating(ratings: number[]): number {
  if (ratings.length === 0) return 1000;
  return Math.round(ratings.reduce((sum, r) => sum + r, 0) / ratings.length);
}