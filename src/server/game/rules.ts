import type { Rule } from './types';

// Генерация случайного символа для правила
export function generateSymbol(rule: Rule): string {
  switch (rule) {
    case 'EVEN_ODD':
      return String(Math.floor(Math.random() * 10));
    
    case 'VOWEL_CONSONANT':
      return String.fromCharCode(97 + Math.floor(Math.random() * 26));
    
    case 'MULTIPLE_OF_THREE':
      return String(Math.floor(Math.random() * 100));
    
    default:
      return '0';
  }
}

// Проверка правильности ответа
export function checkAnswer(symbol: string, answer: boolean, rule: Rule): boolean {
  switch (rule) {
    case 'EVEN_ODD': {
      const isEven = parseInt(symbol) % 2 === 0;
      return answer === isEven;
    }
    
    case 'VOWEL_CONSONANT': {
      const isVowel = 'aeiou'.includes(symbol.toLowerCase());
      return answer === isVowel;
    }
    
    case 'MULTIPLE_OF_THREE': {
      const isMultiple = parseInt(symbol) % 3 === 0;
      return answer === isMultiple;
    }
    
    default:
      return false;
  }
}

// Человекочитаемое название правила
export function getRuleDisplayName(rule: Rule): string {
  const names: Record<Rule, string> = {
    EVEN_ODD: 'Чётное?',
    VOWEL_CONSONANT: 'Гласная?',
    MULTIPLE_OF_THREE: 'Кратно 3?',
  };
  return names[rule];
}

// Названия кнопок для правила
export function getRuleButtons(rule: Rule): [string, string] {
  const buttons: Record<Rule, [string, string]> = {
    EVEN_ODD: ['Чётное', 'Нечётное'],
    VOWEL_CONSONANT: ['Гласная', 'Согласная'],
    MULTIPLE_OF_THREE: ['Да', 'Нет'],
  };
  return buttons[rule];
}