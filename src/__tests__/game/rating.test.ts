import { describe, it, expect } from 'vitest';
import { calculateEloChange, calculateTeamRating } from '../../server/game/rating';

describe('Рейтинговая система', () => {
  describe('calculateEloChange', () => {
    it('равные — равное изменение', () => {
      const result = calculateEloChange(1200, 1200, 1);
      expect(result.teamA).toBe(16);
      expect(result.teamB).toBe(-16);
    });
    it('сумма изменений = 0', () => {
      const result = calculateEloChange(1500, 1000, 1);
      expect(result.teamA + result.teamB).toBe(0);
    });
    it('победа фаворита — мало очков', () => {
      const result = calculateEloChange(1500, 1000, 1);
      expect(result.teamA).toBeLessThan(10);
    });
    it('победа аутсайдера — много очков', () => {
      const result = calculateEloChange(1000, 1500, 1);
      expect(result.teamA).toBeGreaterThan(20);
    });
    it('ничья', () => {
      const result = calculateEloChange(1200, 1400, 0.5);
      expect(result.teamA).toBeGreaterThan(0);
      expect(result.teamB).toBeLessThan(0);
    });
  });

  describe('calculateTeamRating', () => {
    it('средний рейтинг', () => {
      expect(calculateTeamRating([1200, 1400])).toBe(1300);
    });
    it('пустая команда', () => {
      expect(calculateTeamRating([])).toBe(1000);
    });
  });
});