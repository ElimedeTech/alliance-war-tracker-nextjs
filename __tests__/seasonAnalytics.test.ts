/// <reference types="jest" />
import { computeSeasonAnalytics } from '../lib/seasonAnalytics';
import { War, Player, Battlegroup, Path, MiniBoss, Boss } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makePlayer = (id: string, bg: number): Player => ({
  id, name: id, bgAssignment: bg,
  pathFights: 0, mbFights: 0, totalDeaths: 0, warsParticipated: 0,
});

const makePath = (pathNumber: number, section: 1|2, playerId: string, deaths = 0): Path => ({
  id: `p-${pathNumber}-${section}`, pathNumber, section,
  assignedPlayerId: playerId, primaryDeaths: deaths,
  backupHelped: false, backupPlayerId: '', backupDeaths: 0,
  playerNoShow: false, replacedByPlayerId: '',
  status: 'completed', notes: '',
});

const makeMb = (node: number, playerId: string, deaths = 0): MiniBoss => ({
  id: `mb-${node}`, nodeNumber: node, name: `MB ${node}`,
  assignedPlayerId: playerId, primaryDeaths: deaths,
  backupHelped: false, backupPlayerId: '', backupDeaths: 0,
  playerNoShow: false, replacedByPlayerId: '',
  status: 'completed', notes: '',
});

const makeBoss = (playerId: string, deaths = 0): Boss => ({
  id: 'boss', nodeNumber: 50, name: 'Final Boss',
  assignedPlayerId: playerId, primaryDeaths: deaths,
  backupHelped: false, backupPlayerId: '', backupDeaths: 0,
  playerNoShow: false, replacedByPlayerId: '',
  status: 'completed', notes: '',
});

const makeBg = (bgNumber: number, paths: Path[], mbs: MiniBoss[], boss: Boss): Battlegroup => ({
  bgNumber, paths, miniBosses: mbs, boss,
  attackBonus: 0, maxAttackBonus: 63230,
  pointsPerDeath: 0, totalKills: 0, defenderKills: 0, exploration: 0, players: [],
});

const makeWar = (id: string, bgs: Battlegroup[], result: War['allianceResult'] = 'win'): War => ({
  id, name: id,
  battlegroups: bgs,
  allianceResult: result,
  seasonId: 'season-1',
});

// ─── Split mode ───────────────────────────────────────────────────────────────

describe('computeSeasonAnalytics — split mode', () => {
  const p1 = makePlayer('p1', 0);
  const p2 = makePlayer('p2', 0);

  const sec1 = makePath(1, 1, 'p1', 0);
  const sec2 = makePath(1, 2, 'p2', 1);
  const bg   = makeBg(1, [sec1, sec2], [], makeBoss('', 0));
  const war  = makeWar('w1', [bg, makeBg(2, [], [], makeBoss('', 0)), makeBg(3, [], [], makeBoss('', 0))]);

  const analytics = computeSeasonAnalytics([war], [p1, p2], 'split');

  it('credits 2 fights per section record in split mode', () => {
    const p1Stats = analytics.playerStats.find(p => p.playerId === 'p1');
    const p2Stats = analytics.playerStats.find(p => p.playerId === 'p2');
    expect(p1Stats?.totalPathFights).toBe(2);
    expect(p2Stats?.totalPathFights).toBe(2);
  });

  it('counts deaths correctly per player', () => {
    const p1Stats = analytics.playerStats.find(p => p.playerId === 'p1');
    const p2Stats = analytics.playerStats.find(p => p.playerId === 'p2');
    expect(p1Stats?.totalDeaths).toBe(0);
    expect(p2Stats?.totalDeaths).toBe(1);
  });
});

// ─── Single mode ──────────────────────────────────────────────────────────────

describe('computeSeasonAnalytics — single mode', () => {
  const p1 = makePlayer('p1', 0);

  // Single mode: only sec-1 record counted (sec-2 is a sync copy and skipped)
  const sec1 = makePath(1, 1, 'p1', 1);
  const sec2 = makePath(1, 2, 'p1', 1); // sync copy — should be skipped
  const bg   = makeBg(1, [sec1, sec2], [], makeBoss('', 0));
  const war  = makeWar('w1', [bg, makeBg(2, [], [], makeBoss('', 0)), makeBg(3, [], [], makeBoss('', 0))]);

  const analytics = computeSeasonAnalytics([war], [p1], 'single');

  it('credits 4 fights per sec-1 record in single mode', () => {
    const stats = analytics.playerStats.find(p => p.playerId === 'p1');
    expect(stats?.totalPathFights).toBe(4);
  });

  it('does not double-count sec-2 records in single mode', () => {
    const stats = analytics.playerStats.find(p => p.playerId === 'p1');
    // If sec-2 were counted, totalPathFights would be 8
    expect(stats?.totalPathFights).toBe(4);
  });

  it('counts deaths from sec-1 only in single mode', () => {
    const stats = analytics.playerStats.find(p => p.playerId === 'p1');
    expect(stats?.totalDeaths).toBe(1);
  });
});

// ─── soloRate clamping ────────────────────────────────────────────────────────

describe('soloRate clamping for legacy data', () => {
  const p1 = makePlayer('p1', 0);

  // Legacy bug: deaths > fights (old 2-fight count recorded against 4 actual deaths)
  const badPath = { ...makePath(1, 1, 'p1', 8), primaryDeaths: 8 }; // 8 deaths, 2 fights
  const bg = makeBg(1, [badPath], [], makeBoss('', 0));
  const war = makeWar('w1', [bg, makeBg(2, [], [], makeBoss('', 0)), makeBg(3, [], [], makeBoss('', 0))]);

  const analytics = computeSeasonAnalytics([war], [p1], 'split');

  it('clamps warRec.soloRate to 0 — never negative', () => {
    const stats = analytics.playerStats.find(p => p.playerId === 'p1');
    expect(stats?.warHistory[0]?.soloRate).toBeGreaterThanOrEqual(0);
  });

  it('clamps overallSoloRate to 0', () => {
    const stats = analytics.playerStats.find(p => p.playerId === 'p1');
    expect(stats?.overallSoloRate).toBeGreaterThanOrEqual(0);
  });

  it('clamps bayesianSoloRate to 0', () => {
    const stats = analytics.playerStats.find(p => p.playerId === 'p1');
    expect(stats?.bayesianSoloRate).toBeGreaterThanOrEqual(0);
  });
});

// ─── bgTotals ─────────────────────────────────────────────────────────────────

describe('bgTotals', () => {
  const p1 = makePlayer('p1', 0); // BG1

  const sec1 = makePath(1, 1, 'p1', 2);
  const bg1  = makeBg(1, [sec1], [], makeBoss('', 0));
  const war  = makeWar('w1', [bg1, makeBg(2, [], [], makeBoss('', 0)), makeBg(3, [], [], makeBoss('', 0))]);

  const analytics = computeSeasonAnalytics([war], [p1], 'split');

  it('soloRate for bgTotals is clamped to [0, 100]', () => {
    expect(analytics.bgTotals[1].soloRate).toBeGreaterThanOrEqual(0);
    expect(analytics.bgTotals[1].soloRate).toBeLessThanOrEqual(100);
  });

  it('does not crash on out-of-range bgNumber', () => {
    const badBg = { ...makeBg(99, [sec1], [], makeBoss('', 0)) };
    const badWar = makeWar('w2', [badBg, makeBg(2, [], [], makeBoss('', 0)), makeBg(3, [], [], makeBoss('', 0))]);
    expect(() => computeSeasonAnalytics([badWar], [p1], 'split')).not.toThrow();
  });
});

// ─── Season filtering ─────────────────────────────────────────────────────────

describe('season filtering', () => {
  const p1 = makePlayer('p1', 0);
  const bg = makeBg(1, [makePath(1, 1, 'p1', 0)], [], makeBoss('', 0));

  const war1: War = { ...makeWar('w1', [bg, makeBg(2, [], [], makeBoss('', 0)), makeBg(3, [], [], makeBoss('', 0))]), seasonId: 'season-1' };
  const war2: War = { ...makeWar('w2', [bg, makeBg(2, [], [], makeBoss('', 0)), makeBg(3, [], [], makeBoss('', 0))]), seasonId: 'season-2' };

  it('only includes wars passed in — caller is responsible for filtering', () => {
    const analytics = computeSeasonAnalytics([war1], [p1], 'split');
    expect(analytics.totalWars).toBe(1);
  });

  it('includes all wars when both passed', () => {
    const analytics = computeSeasonAnalytics([war1, war2], [p1], 'split');
    expect(analytics.totalWars).toBe(2);
  });
});