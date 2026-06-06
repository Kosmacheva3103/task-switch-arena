# Тестирование TaskSwitch Arena

## Стратегия тестирования

Применено модульное тестирование (unit-тесты) для игровой логики.

## Структура тестов
tests/
└── game/
├── rules.test.ts # Правила классификации
├── scoring.test.ts # Подсчёт очков
├── rating.test.ts # Elo рейтинг
└── matchManager.test.ts # Управление матчами

text

## Результаты
✓ rules.test.ts (11 tests)
✓ scoring.test.ts (7 tests)
✓ rating.test.ts (7 tests)
✓ matchManager.test.ts (5 tests)

Tests: 30 passed (30)

text

## Запуск

```bash
npm test
Покрытие
Модуль	Тестов
rules.ts	11
scoring.ts	7
rating.ts	7
matchManager.ts	5
Всего	30