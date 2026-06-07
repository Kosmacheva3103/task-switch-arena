import { nanoid } from 'nanoid';
import type { GameState, Player, Team, RoundResult, Rule } from './types';
import { generateSymbol, checkAnswer, getRuleDisplayName } from './rules';
import { calculateRoundScore, getTeamPenalty } from './scoring';
import { calculateEloChange, calculateTeamRating } from './rating';

/**
 * MatchManager — центральный класс управления игровыми матчами
 * Хранит все активные матчи в памяти (In-Memory Store)
 */
class MatchManager {
  // Хранилище активных матчей
  private matches: Map<string, GameState> = new Map();
  
  // Таймеры для смены раундов
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  // Ответы игроков в текущем раунде
  private roundAnswers: Map<string, Map<string, { answer: boolean; timeMs: number }>> = new Map();
  /**
   * Проверяет, находится ли игрок (по userId) в каком-либо матче
   */
  isPlayerInAnyMatch(userId: string, excludeMatchId?: string): boolean {
    for (const [id, match] of this.matches) {
      if (id === excludeMatchId) continue;
      if (match.status !== 'waiting' && match.status !== 'active') continue;

      const allPlayers = [
        ...match.teams[0].players,
        ...match.teams[1].players,
      ];

      if (allPlayers.some(p => (p as any).userId === userId)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Создание нового матча
   */
  createMatch(): { matchId: string; inviteCode: string } {
    const matchId = nanoid(12);
    const inviteCode = nanoid(6).toUpperCase();
    
    const initialState: GameState = {
      matchId,
      status: 'waiting',
      currentRule: null,
      currentSymbol: null,
      roundNumber: 0,
      maxRounds: 15,
      teams: [
        {
          id: 'team_a',
          name: 'Команда А',
          players: [],
          totalScore: 0,
        },
        {
          id: 'team_b',
          name: 'Команда Б',
          players: [],
          totalScore: 0,
        },
      ],
      timeRemaining: 0,
      roundResults: [],
      createdAt: new Date().toISOString(),
    };
    
    this.matches.set(matchId, initialState);
    this.roundAnswers.set(matchId, new Map());
    
    return { matchId, inviteCode };
  }
  createMatchById(matchId: string): GameState {
  const initialState: GameState = {
    matchId,
    status: 'waiting',
    currentRule: null,
    currentSymbol: null,
    roundNumber: 0,
    maxRounds: 15,
    teams: [
      { id: 'team_a', name: 'Команда А', players: [], totalScore: 0 },
      { id: 'team_b', name: 'Команда Б', players: [], totalScore: 0 },
    ],
    timeRemaining: 0,
    roundResults: [],
    createdAt: new Date().toISOString(),
  };

  this.matches.set(matchId, initialState);
  this.roundAnswers.set(matchId, new Map());

  return initialState;
}
  /**
   * Получение состояния матча
   */
  getMatch(matchId: string): GameState | undefined {
    return this.matches.get(matchId);
  }

  /**
   * Добавление игрока в матч
   */
  addPlayer(matchId: string, player: Player): boolean {
    const match = this.matches.get(matchId);
    
    if (!match) return false;
    if (match.status !== 'waiting') return false;
    
    const totalPlayers = match.teams[0].players.length + match.teams[1].players.length;
    if (totalPlayers >= 6) return false;
    
    // Временно добавляем в команду с меньшим количеством игроков
    if (match.teams[0].players.length <= match.teams[1].players.length) {
      match.teams[0].players.push(player);
    } else {
      match.teams[1].players.push(player);
    }
    
    return true;
  }

  /**
   * Удаление игрока из матча
   */
  removePlayer(matchId: string, playerId: string): boolean {
    const match = this.matches.get(matchId);
    if (!match) return false;
    
    for (const team of match.teams) {
      const index = team.players.findIndex(p => p.id === playerId);
      if (index !== -1) {
        team.players.splice(index, 1);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Запуск матча
   * Выполняет snake draft распределение и заполнение ботами
   */
  startMatch(matchId: string): GameState | null {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'waiting') return null;
    
    // Перераспределение игроков (snake draft)
    this.redistributePlayers(match);
    
    // Заполнение ботами до 6 игроков
    this.fillWithBots(match);
    
    match.status = 'active';
    match.roundNumber = 0;
    
    return match;
  }

  /**
   * Snake draft распределение игроков по командам
   * Паттерн: A, B, B, A, A, B (для баланса)
   */
  private redistributePlayers(match: GameState): void {
    // Собираем всех реальных игроков
    const allPlayers = [...match.teams[0].players, ...match.teams[1].players]
      .filter(p => !p.isBot)
      .sort((a, b) => b.rating - a.rating);
    
    // Очищаем команды
    match.teams[0].players = [];
    match.teams[1].players = [];
    
    // Snake draft pattern: A B B A A B
    const teamIndices = [0, 1, 1, 0, 0, 1];
    
    allPlayers.forEach((player, i) => {
      if (i < teamIndices.length) {
        match.teams[teamIndices[i]].players.push(player);
      }
    });
  }

  /**
   * Заполнение команд ботами до 6 игроков
   */
  private fillWithBots(match: GameState): void {
    const totalPlayers = match.teams[0].players.length + match.teams[1].players.length;
    const botsNeeded = 6 - totalPlayers;
    
    const botConfigs = [
      { name: 'Бот Лёгкий', minRating: 800, maxRating: 1000, accuracy: 0.60, minTime: 1000, maxTime: 2500 },
      { name: 'Бот Средний', minRating: 1100, maxRating: 1300, accuracy: 0.75, minTime: 600, maxTime: 1800 },
      { name: 'Бот Сложный', minRating: 1400, maxRating: 1600, accuracy: 0.88, minTime: 300, maxTime: 1200 },
    ];
    
    for (let i = 0; i < botsNeeded; i++) {
      const config = botConfigs[i % botConfigs.length];
      
      const bot: Player = {
        id: `bot_${nanoid(8)}`,
        name: config.name,
        rating: config.minRating + Math.floor(Math.random() * (config.maxRating - config.minRating)),
        isBot: true,
        individualScore: 0,
        errors: 0,
      };
      
      // Добавляем бота в команду с меньшим количеством игроков
      if (match.teams[0].players.length <= match.teams[1].players.length) {
        match.teams[0].players.push(bot);
      } else {
        match.teams[1].players.push(bot);
      }
    }
  }

  /**
   * Переход к следующему раунду
   */
  nextRound(matchId: string): GameState | null {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'active') return null;
    
    match.roundNumber++;
    
    // Проверка завершения матча
    if (match.roundNumber > match.maxRounds) {
      return this.endMatch(matchId);
    }
    
    // Выбор правила (циклически)
    const rules: Rule[] = ['EVEN_ODD', 'VOWEL_CONSONANT', 'MULTIPLE_OF_THREE'];
    match.currentRule = rules[(match.roundNumber - 1) % rules.length];
    match.currentSymbol = generateSymbol(match.currentRule);
    
    // Случайная длительность раунда (5-15 секунд)
    match.timeRemaining = 5000 + Math.floor(Math.random() * 10000);
    
    // Очистка ответов предыдущего раунда
    this.roundAnswers.set(matchId, new Map());
    
    return match;
  }

  /**
   * Обработка ответа игрока
   */
  submitAnswer(
    matchId: string,
    playerId: string,
    answer: boolean,
    responseTimeMs: number
  ): {
    accepted: boolean;
    correct?: boolean;
    points?: number;
    message?: string;
  } {
    const match = this.matches.get(matchId);
    
    if (!match || match.status !== 'active') {
      return { accepted: false, message: 'Матч не активен' };
    }
    
    // Античит: минимальное время ответа
    if (responseTimeMs < 100) {
      return { accepted: false, message: 'Ответ слишком быстрый' };
    }
    
    // Проверка на повторный ответ
    const answers = this.roundAnswers.get(matchId);
    if (answers?.has(playerId)) {
      return { accepted: false, message: 'Уже ответили в этом раунде' };
    }
    
    if (!match.currentRule || !match.currentSymbol) {
      return { accepted: false, message: 'Нет активного раунда' };
    }
    
    // Проверка правильности ответа
    const correct = checkAnswer(match.currentSymbol, answer, match.currentRule);
    const points = calculateRoundScore(responseTimeMs, correct);
    
    // Сохранение ответа
    answers?.set(playerId, { answer, timeMs: responseTimeMs });
    
    // Поиск игрока
    let player: Player | undefined;
    let team: Team | undefined;
    
    for (const t of match.teams) {
      const p = t.players.find(p => p.id === playerId);
      if (p) {
        player = p;
        team = t;
        break;
      }
    }
    
    if (!player || !team) {
      return { accepted: false, message: 'Игрок не найден' };
    }
    
    // Обновление счёта
    player.individualScore += points;
    
    if (!correct) {
      player.errors++;
      team.totalScore += getTeamPenalty();
    } else {
      team.totalScore += points;
    }
    
    // Запись результата раунда
    const result: RoundResult = {
      playerId,
      playerName: player.name,
      symbol: match.currentSymbol,
      playerAnswer: answer,
      correctAnswer: correct,
      wasCorrect: correct,
      points,
      responseTimeMs,
    };
    
    match.roundResults.push(result);
    
    return { accepted: true, correct, points };
  }

  /**
   * Получение ответа бота (используется для симуляции)
   */
  getBotAnswer(matchId: string, botId: string): { answer: boolean; delay: number } | null {
    const match = this.matches.get(matchId);
    if (!match || !match.currentRule || !match.currentSymbol) return null;
    
    const correctAnswer = checkAnswer(match.currentSymbol, true, match.currentRule);
    
    // Определение уровня бота по рейтингу
    let accuracy: number;
    let minTime: number;
    let maxTime: number;
    
    // Ищем бота для определения его параметров
    let botRating = 1000;
    for (const team of match.teams) {
      const bot = team.players.find(p => p.id === botId);
      if (bot) {
        botRating = bot.rating;
        break;
      }
    }
    
    if (botRating < 1000) {
      accuracy = 0.60;
      minTime = 1000;
      maxTime = 2500;
    } else if (botRating < 1300) {
      accuracy = 0.75;
      minTime = 600;
      maxTime = 1800;
    } else {
      accuracy = 0.88;
      minTime = 300;
      maxTime = 1200;
    }
    
    // Бот отвечает правильно с вероятностью accuracy
    const willBeCorrect = Math.random() < accuracy;
    const answer = willBeCorrect ? correctAnswer : !correctAnswer;
    const delay = minTime + Math.floor(Math.random() * (maxTime - minTime));
    
    return { answer, delay };
  }

  /**
   * Завершение матча
   */
  endMatch(matchId: string): GameState | null {
    const match = this.matches.get(matchId);
    if (!match) return null;
    
    match.status = 'finished';
    
    // Очистка таймера
    const timer = this.timers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(matchId);
    }
    
    return match;
  }

  /**
   * Получение победителя матча
   */
  getWinner(matchId: string): Team | null {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'finished') return null;
    
    if (match.teams[0].totalScore > match.teams[1].totalScore) {
      return match.teams[0];
    } else if (match.teams[1].totalScore > match.teams[0].totalScore) {
      return match.teams[1];
    }
    
    return null; // Ничья
  }

  /**
   * Расчёт изменения рейтинга для команд
   */
  calculateRatingChanges(matchId: string): { teamA: number; teamB: number } | null {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'finished') return null;
    
    const ratingA = calculateTeamRating(match.teams[0].players.map(p => p.rating));
    const ratingB = calculateTeamRating(match.teams[1].players.map(p => p.rating));
    
    const scoreA = match.teams[0].totalScore > match.teams[1].totalScore ? 1
      : match.teams[0].totalScore < match.teams[1].totalScore ? 0
      : 0.5;
    
    return calculateEloChange(ratingA, ratingB, scoreA);
  }

  /**
   * Удаление завершённого матча из памяти
   */
  cleanupMatch(matchId: string): void {
    this.matches.delete(matchId);
    this.roundAnswers.delete(matchId);
    
    const timer = this.timers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(matchId);
    }
  }
}

// Экспортируем единственный экземпляр (Singleton)
export const matchManager = new MatchManager();