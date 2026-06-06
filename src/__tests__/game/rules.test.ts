import { describe, it, expect } from 'vitest';
import { checkAnswer, generateSymbol, getRuleDisplayName, getRuleButtons } from '../../server/game/rules';

describe('Правила классификации', () => {
  describe('EVEN_ODD (Чёт/нечет)', () => {
    it('чётные числа — ответ ДА', () => {
      expect(checkAnswer('4', true, 'EVEN_ODD')).toBe(true);
      expect(checkAnswer('0', true, 'EVEN_ODD')).toBe(true);
      expect(checkAnswer('8', true, 'EVEN_ODD')).toBe(true);
    });
    it('чётные числа — ответ НЕТ', () => {
      expect(checkAnswer('4', false, 'EVEN_ODD')).toBe(false);
    });
    it('нечётные числа — ответ НЕТ', () => {
      expect(checkAnswer('7', false, 'EVEN_ODD')).toBe(true);
    });
  });

  describe('VOWEL_CONSONANT (Гласные/согласные)', () => {
    it('гласные буквы', () => {
      expect(checkAnswer('a', true, 'VOWEL_CONSONANT')).toBe(true);
      expect(checkAnswer('e', true, 'VOWEL_CONSONANT')).toBe(true);
    });
    it('согласные буквы', () => {
      expect(checkAnswer('k', false, 'VOWEL_CONSONANT')).toBe(true);
    });
  });

  describe('MULTIPLE_OF_THREE (Кратно 3)', () => {
    it('кратные трём', () => {
      expect(checkAnswer('9', true, 'MULTIPLE_OF_THREE')).toBe(true);
    });
    it('некратные трём', () => {
      expect(checkAnswer('7', false, 'MULTIPLE_OF_THREE')).toBe(true);
    });
  });

  describe('generateSymbol', () => {
    it('генерирует цифры для EVEN_ODD', () => {
      for (let i = 0; i < 50; i++) {
        expect(generateSymbol('EVEN_ODD')).toMatch(/^\d$/);
      }
    });
    it('генерирует буквы для VOWEL_CONSONANT', () => {
      for (let i = 0; i < 50; i++) {
        expect(generateSymbol('VOWEL_CONSONANT')).toMatch(/^[a-z]$/);
      }
    });
  });

  describe('getRuleDisplayName', () => {
    it('возвращает русские названия', () => {
      expect(getRuleDisplayName('EVEN_ODD')).toBe('Чётное?');
      expect(getRuleDisplayName('VOWEL_CONSONANT')).toBe('Гласная?');
      expect(getRuleDisplayName('MULTIPLE_OF_THREE')).toBe('Кратно 3?');
    });
  });

  describe('getRuleButtons', () => {
    it('возвращает правильные кнопки', () => {
      expect(getRuleButtons('EVEN_ODD')).toEqual(['Чётное', 'Нечётное']);
      expect(getRuleButtons('VOWEL_CONSONANT')).toEqual(['Гласная', 'Согласная']);
      expect(getRuleButtons('MULTIPLE_OF_THREE')).toEqual(['Да', 'Нет']);
    });
  });
});