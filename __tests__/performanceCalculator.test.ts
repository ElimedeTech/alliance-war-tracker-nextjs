/// <reference types="jest" />
import { calculatePlayerWarPerformance } from '../lib/performanceCalculator';
import { War, Player, Battlegroup, Path, MiniBoss, Boss } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makePlayer = (id: string, bg = 0): Player => ({
  id, name: id, bgAssignment: bg,
  pathFights: 0, mbFights: 0, totalDeaths: 0, warsParticipated: 0,
});

const makePath = (
  pathNumber: number,
  section: 1|2,
  playerId: string,
  deaths = 0,
  overrides: Partial<Path> = {}
): Path => ({
  id: `p-${pathNumber}-${section}`,
  pathNumber, section,
  assignedPlayerId: playerId,
  primaryDeaths: deaths,
  backupHelped: false, backupPlayerId: '', backupDeaths: 0,
  playerNoShow: false, replacedByPlayerId: '',
  status: 'completed', notes: '',
  ...overrides,
});

const makeMb = (node: number, playerId: string, deaths = 0): MiniBoss => ({
  id: `mb-${node}`, nodeNumber: node, name: `MB${node}`,
  assignedPlayerId: playerId, primaryDeaths: deaths,
  backupHelped: false, backupPlayerId: '', backupDeaths: 0,
  playerNoShow: false, replacedByPlayerId: '',
  status: 'completed', notes: '',
});

const makeBoss = (playerId = '', deaths = 0): Boss => ({
  id: 'boss', nodeNumber: 50, name: 'Final Boss',
  assignedPlayerId: playerId, primaryDeaths: deaths,
  backupHelped: false, backupPlayerId: '', backupDeaths: 0,
  playerNoShow: false, replacedByPlayerId: '',
  status: 'completed', notes: '',
});

const makeBg = (n: number, paths: Path[], mbs: MiniBoss[] = [], boss?: Boss): Battlegroup => ({
  bgNumber: n, paths, miniBosses: mbs, boss: boss ?? makeBoss(),
  attackBonus: 0, maxAttackBonus: 63230,
  pointsPerDeath: 0, totalKills: 0, defenderKills: 0, exploration: 0, players: [],
});

const makeWar = (id: string, bgs: Battlegroup[]): War => ({
  id, name: id, battlegroups: bgs, allianceResult: 'win',
});

// ─── Split mode fight counting ────────────────────────────────────────────────

describe('calculatePlayerWarPerformance — split mode', () => {
  const p1 = makePlayer('p1', 0);
  const sec1 = makePath(1, 1, 'p1', 1);
  const sec2 = makePath(1, 2, 'p1', 0);
  const bg = makeBg(1, [sec1, sec2]);
  const war = makeWar('w1', [bg, makeBg(2, []), makeBg(3, [])]);

  const perfs = calculatePlayerWarPerformance(war, 's1', [p1], 'split');
  const p1perf = perfs.find(p => p.playerId === 'p1')!;

  it('credits 2 fights per section record in split mode', () => {
    // 2 section records × 2 fights = 4 path fights
    expect(p1perf.pathFights).toBe(4);
  });

  it('tracks deaths per record correctly', () => {
    expect(p1perf.pathDeaths).toBe(1);
  });
});

// ─── Single mode fight counting ───────────────────────────────────────────────

describe('calculatePlayerWarPerformance — single mode', () => {
  const p1 = makePlayer('p1', 0);
  // In single mode, both sec records have the same player;
  // sec-1 is counted at 4 fights, sec-2 at 4 fights = 8 total
  const sec1 = makePath(1, 1, 'p1', 2);
  const sec2 = makePath(1, 2, 'p1', 2);
  const bg = makeBg(1, [sec1, sec2]);
  const war = makeWar('w1', [bg, makeBg(2, []), makeBg(3, [])]);

  const perfs = calculatePlayerWarPerformance(war, 's1', [p1], 'single');
  const p1perf = perfs.find(p => p.playerId === 'p1')!;

  it('credits 4 fights per record in single mode', () => {
    // 2 records × 4 fights = 8
    expect(p1perf.pathFights).toBe(8);
  });
});

// ─── Backup player ────────────────────────────────────────────────────────────

describe('backup player credit', () => {
  const primary = makePlayer('primary', 0);
  const backup  = makePlayer('backup', 0);

  const path = makePath(1, 1, 'primary', 0, {
    backupHelped: true,
    backupPlayerId: 'backup',
    backupFights: 1,
    backupDeaths: 1,
  });
  const bg  = makeBg(1, [path]);
  const war = makeWar('w1', [bg, makeBg(2, []), makeBg(3, [])]);

  const perfs = calculatePlayerWarPerformance(war, 's1', [primary, backup], 'split');
  const backupPerf  = perfs.find(p => p.playerId === 'backup')!;
  const primaryPerf = perfs.find(p => p.playerId === 'primary')!;

  it('credits backup with their share of fights', () => {
    expect(backupPerf.pathFights).toBe(1);
    expect(backupPerf.backupAssists).toBe(1);
  });

  it('credits primary with remaining fights', () => {
    // 2 total - 1 backup = 1
    expect(primaryPerf.pathFights).toBe(1);
  });

  it('attributes backup deaths to backup player', () => {
    expect(backupPerf.pathDeaths).toBe(1);
    expect(primaryPerf.pathDeaths).toBe(0);
  });
});

// ─── No-show replacement ──────────────────────────────────────────────────────

describe('no-show player replacement', () => {
  const noShow     = makePlayer('noshow', 0);
  const replacement = makePlayer('replacement', 0);

  const path = makePath(1, 1, 'noshow', 2, {
    playerNoShow: true,
    replacedByPlayerId: 'replacement',
  });
  const bg  = makeBg(1, [path]);
  const war = makeWar('w1', [bg, makeBg(2, []), makeBg(3, [])]);

  const perfs = calculatePlayerWarPerformance(war, 's1', [noShow, replacement], 'split');
  const replPerf  = perfs.find(p => p.playerId === 'replacement')!;

  it('credits replacement with the full path fights', () => {
    expect(replPerf.pathFights).toBe(2);
    expect(replPerf.noShowCovers).toBe(1);
  });
});

// ─── warsParticipated accuracy ────────────────────────────────────────────────

describe('warsParticipated', () => {
  const p1 = makePlayer('p1', 0);
  const p2 = makePlayer('p2', 0); // not assigned in war

  const path = makePath(1, 1, 'p1');
  const bg   = makeBg(1, [path]);
  const war  = makeWar('w1', [bg, makeBg(2, []), makeBg(3, [])]);

  it('is 1 for a player who fought', () => {
    const perfs = calculatePlayerWarPerformance(war, 's1', [p1], 'split');
    const p1perf = perfs.find(p => p.playerId === 'p1')!;
    expect(p1perf.totalFights).toBeGreaterThan(0);
  });

  it('is 0 fights for a player with no assignments', () => {
    const perfs = calculatePlayerWarPerformance(war, 's1', [p1, p2], 'split');
    const p2perf = perfs.find(p => p.playerId === 'p2')!;
    expect(p2perf.totalFights).toBe(0);
  });
});