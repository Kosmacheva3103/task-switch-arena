import { describe, it, expect, beforeEach } from 'vitest';
import { matchManager } from '../../server/game/matchManager';

describe('MatchManager', () => {
  let matchId: string;

  beforeEach(() => {
    const { matchId: id } = matchManager.createMatch();
    matchId = id;
  });

  it('создаёт матч со статусом waiting', () => {
    const match = matchManager.getMatch(matchId);
    expect(match).toBeDefined();
    expect(match?.status).toBe('waiting');
  });

  it('добавляет игроков', () => {
    matchManager.addPlayer(matchId, {
      id: 'p1', name: 'Alice', rating: 1400, isBot: false, individualScore: 0, errors: 0,
    });
    const match = matchManager.getMatch(matchId);
    const total = match!.teams[0].players.length + match!.teams[1].players.length;
    expect(total).toBe(1);
  });

  it('запускает матч и добавляет ботов', () => {
    matchManager.addPlayer(matchId, {
      id: 'p1', name: 'A', rating: 1400, isBot: false, individualScore: 0, errors: 0,
    });
    const match = matchManager.startMatch(matchId);
    expect(match?.status).toBe('active');
    const total = match!.teams[0].players.length + match!.teams[1].players.length;
    expect(total).toBe(6);
  });

  it('обрабатывает ответы', () => {
    matchManager.startMatch(matchId);
    matchManager.nextRound(matchId);
    const match = matchManager.getMatch(matchId);
    const player = match!.teams[0].players[0];
    const result = matchManager.submitAnswer(matchId, player.id, true, 500);
    expect(result.accepted).toBe(true);
  });

  it('завершает матч', () => {
    matchManager.startMatch(matchId);
    matchManager.endMatch(matchId);
    expect(matchManager.getMatch(matchId)?.status).toBe('finished');
  });
});