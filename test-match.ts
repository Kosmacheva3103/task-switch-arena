import { matchManager } from './src/server/game/matchManager';

// Создаём матч
const { matchId, inviteCode } = matchManager.createMatch();
console.log('Матч создан:', matchId, 'Код:', inviteCode);

// Добавляем игроков
matchManager.addPlayer(matchId, {
  id: 'player1', name: 'Alice', rating: 1400, isBot: false, individualScore: 0, errors: 0
});
matchManager.addPlayer(matchId, {
  id: 'player2', name: 'Bob', rating: 1300, isBot: false, individualScore: 0, errors: 0
});
matchManager.addPlayer(matchId, {
  id: 'player3', name: 'Carol', rating: 1250, isBot: false, individualScore: 0, errors: 0
});
matchManager.addPlayer(matchId, {
  id: 'player4', name: 'Dave', rating: 1200, isBot: false, individualScore: 0, errors: 0
});

// Запускаем матч
const game = matchManager.startMatch(matchId);
console.log('\nСтатус:', game?.status);
console.log('Команда А:', game?.teams[0].players.map(p => p.name));
console.log('Команда Б:', game?.teams[1].players.map(p => p.name));

// Симулируем несколько раундов
for (let i = 0; i < 3; i++) {
  matchManager.nextRound(matchId);
  console.log(`\nРаунд ${i + 1}: ${game?.currentRule} — символ: ${game?.currentSymbol}`);
  
  // Ответы игроков
  matchManager.submitAnswer(matchId, 'player1', true, 500);
  matchManager.submitAnswer(matchId, 'player2', false, 800);
  
  console.log('Счёт команд:', game?.teams.map(t => `${t.name}: ${t.totalScore}`));
}

// Завершаем
matchManager.endMatch(matchId);
const winner = matchManager.getWinner(matchId);
console.log('\nПобедитель:', winner?.name);
console.log('Финальный счёт:', game?.teams.map(t => `${t.name}: ${t.totalScore}`));