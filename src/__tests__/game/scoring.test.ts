import { describe, it, expect } from 'vitest';
import { calculateRoundScore, getTeamPenalty, calculateTeamScore } from '../../server/game/scoring';

describe('Подсчёт очков', () => {
  describe('calculateRoundScore', () => {
    it('неправильный ответ — 0 очков', () => {
      expect(calculateRoundScore(500, false)).toBe(0);
    });
    it('быстрый правильный ответ — максимум', () => {
      expect(calculateRoundScore(200, true)).toBe(23);
    });
    it('медленный правильный ответ — только база', () => {
      expect(calculateRoundScore(2000, true)).toBe(10);
    });
    it('очень быстрый ответ', () => {
      expect(calculateRoundScore(50, true)).toBe(25);
    });
  });

  describe('getTeamPenalty', () => {
    it('возвращает -5', () => {
      expect(getTeamPenalty()).toBe(-5);
    });
  });

  describe('calculateTeamScore', () => {
    it('суммирует очки и применяет штрафы', () => {
      expect(calculateTeamScore([20, 15, 10], 2)).toBe(35);
    });
    it('без ошибок — просто сумма', () => {
      expect(calculateTeamScore([20, 15], 0)).toBe(35);
    });
  });
});