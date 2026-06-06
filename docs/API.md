# API документация TaskSwitch Arena

## WebSocket API (Socket.io)

### Подключение

```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');
```

### События клиент → сервер

#### `join_match`
Присоединение к матчу.

```javascript
socket.emit('join_match', {
  matchId: 'ABC12345',
  playerName: 'Alice'
});
```

#### `start_match`
Запуск матча.

```javascript
socket.emit('start_match', { matchId: 'ABC12345' });
```

#### `submit_answer`
Ответ на текущий раунд.

```javascript
socket.emit('submit_answer', {
  matchId: 'ABC12345',
  answer: true,
  responseTimeMs: 750
});
```

### События сервер → клиент

#### `match_started`
Матч начался.

```javascript
socket.on('match_started', (data) => {
  // data: { teams: [...], countdown: 3 }
});
```

#### `rule_changed`
Новый раунд.

```javascript
socket.on('rule_changed', (data) => {
  // data: { rule, ruleDisplay, symbol, roundNumber, timeLimit, buttons }
});
```

#### `round_result`
Результаты раунда.

```javascript
socket.on('round_result', (data) => {
  // data: { roundNumber, teamScores: { teamA, teamB } }
});
```

#### `match_ended`
Матч завершён.

```javascript
socket.on('match_ended', (data) => {
  // data: { winner, isDraw, finalScores, teams }
});
```

#### `player_joined` / `player_left`

```javascript
socket.on('player_joined', (data) => {
  // data: { playerName, playerCount, allPlayers }
});
```

## HTTP API

### `GET /api/match/:id`
Получить информацию о матче.

### `POST /api/auth/sign-up/email`
Регистрация.

**Body:** `{ name, email, password }`

### `POST /api/auth/sign-in/email`
Вход.

**Body:** `{ email, password }`