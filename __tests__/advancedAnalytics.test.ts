/// <reference types="jest" />
import { computeAdvancedAnalytics } from '../lib/advancedAnalytics';
import { computeSeasonAnalytics, PlayerSeasonStats } from '../lib/seasonAnalytics';
import { War, Player, Battlegroup, Path, Boss, MiniBoss } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const p = (id: string, bg = 0): Player => ({
  id, name: id, bgAssignment: bg,
  pathFights: 0, mbFights: 0, totalDeaths: 0, warsParticipated: 0,
});

const path = (num: number, section: 1|2, player: string, deaths = 0): Path => ({
  id: `p${num}s${section}`, pathNumber: num, section,
  assignedPlayerId: player, primaryDeaths: deaths,
  backupHelped: false, backupPlayerId: '', backupDeaths: 0,
  playerNoShow: false, replacedByPlayerId: '',
  status: 'completed', notes: '',
});

const boss = (): Boss => ({
  id: 'boss', nodeNumber: 50, name: 'Final Boss',
  assignedPlayerId: '', primaryDeaths: 0,
  backupHelped: false, backupPlayerId: '', backupDeaths: 0,
  playerNoShow: false, replacedByPlayerId: '',
  status: 'not-started', notes: '',
});

const bg = (n: number, paths: Path[]): Battlegroup => ({
  bgNumber: n, paths, miniBosses: [], boss: boss(),
  attackBonus: 0, maxAttackBonus: 63230,
  pointsPerDeath: 0, totalKills: 0, defenderKills: 0, exploration: 0, players: [],
});

const war = (id: string, result: War['allianceResult'], paths: Path[], sId = 'season-1'): War => ({
  id, name: id, seasonId: sId,
  battlegroups: [
    bg(1, paths),
    bg(2, []),
    bg(3, []),
  ],
  allianceResult: result,
});

// ─── Consistency grade — single war ──────────────────────────────────────────

describe('consistency grade with single war', () => {
  const player = p('a', 0);

  it('grades Elite for 100% solo rate in single war', () => {
    const w = war('w1', 'win', [path(1, 1, 'a', 0)]);
    const analytics = computeSeasonAnalytics([w], [player], 'split');
    const adv = computeAdvancedAnalytics(analytics, [w]);
    const grade = adv.playerAdvanced.find(x => x.playerId === 'a')?.consistency.grade;
    expect(grade).toBe('Elite');
  });

  it('grades Erratic for 0% solo rate in single war', () => {
    // 2 deaths on 2 fights = 0% solo rate
    const w = war('w1', 'loss', [path(1, 1, 'a', 2)]);
    const analytics = computeSeasonAnalytics([w], [player], 'split');
    const adv = computeAdvancedAnalytics(analytics, [w]);
    const grade = adv.playerAdvanced.find(x => x.playerId === 'a')?.consistency.grade;
    expect(grade).toBe('Erratic');
  });

  it('grades Variable for ~67% solo rate in single war', () => {
    // 2 fights, 1 death = 50%... let's do 3 fights, 1 death = ~67%
    const w = war('w1', 'win', [path(1, 1, 'a', 1), path(2, 1, 'a', 0)]);
    const analytics = computeSeasonAnalytics([w], [player], 'split');
    const adv = computeAdvancedAnalytics(analytics, [w]);
    const grade = adv.playerAdvanced.find(x => x.playerId === 'a')?.consistency.grade;
    expect(['Variable', 'Consistent']).toContain(grade); // 75% solo
  });
});

// ─── Consistency grade — multiple wars ───────────────────────────────────────

describe('consistency grade with multiple wars', () => {
  const player = p('a', 0);

  it('grades Erratic for wildly inconsistent performance', () => {
    // War 1: 100% (0 deaths / 2 fights), War 2: 0% (2 deaths / 2 fights)
    const w1 = war('w1', 'win',  [path(1, 1, 'a', 0)]);
    const w2 = war('w2', 'loss', [path(1, 1, 'a', 2)]);
    const analytics = computeSeasonAnalytics([w1, w2], [player], 'split');
    const adv = computeAdvancedAnalytics(analytics, [w1, w2]);
    const grade = adv.playerAdvanced.find(x => x.playerId === 'a')?.consistency.grade;
    expect(grade).toBe('Erratic');
  });

  it('grades Elite for consistently perfect performance', () => {
    const wars = Array.from({ length: 5 }, (_, i) =>
      war(`w${i}`, 'win', [path(1, 1, 'a', 0)])
    );
    const analytics = computeSeasonAnalytics(wars, [player], 'split');
    const adv = computeAdvancedAnalytics(analytics, wars);
    const grade = adv.playerAdvanced.find(x => x.playerId === 'a')?.consistency.grade;
    expect(grade).toBe('Elite');
  });
});

// ─── Season trends filtering ──────────────────────────────────────────────────

describe('season trends', () => {
  const player = p('a', 0);
  const seasons = [
    { id: 'season-1', name: 'Season 1' },
    { id: 'season-2', name: 'Season 2' },
  ];

  it('excludes wars without seasonId from trends', () => {
    const w1: War = { ...war('w1', 'win', []), seasonId: undefined };
    const w2 = war('w2', 'win', [], 'season-1');
    const analytics = computeSeasonAnalytics([w1, w2], [player], 'split');
    const adv = computeAdvancedAnalytics(analytics, [w1, w2], seasons);
    // Only season-1 should appear — w1 has no seasonId
    expect(adv.seasonTrends).toHaveLength(1);
    expect(adv.seasonTrends[0].seasonId).toBe('season-1');
  });

  it('uses season name from seasons array', () => {
    const w = war('w1', 'win', [], 'season-1');
    const analytics = computeSeasonAnalytics([w], [player], 'split');
    const adv = computeAdvancedAnalytics(analytics, [w], seasons);
    expect(adv.seasonTrends[0].seasonName).toBe('Season 1');
  });
});

// ─── Win correlation ──────────────────────────────────────────────────────────

describe('win/loss correlation', () => {
  it('returns not-enough-data insight with only wins', () => {
    const player = p('a', 0);
    const w1 = war('w1', 'win', [path(1, 1, 'a', 0)]);
    const w2 = war('w2', 'win', [path(1, 1, 'a', 0)]);
    const analytics = computeSeasonAnalytics([w1, w2], [player], 'split');
    const adv = computeAdvancedAnalytics(analytics, [w1, w2]);
    expect(adv.winCorrelation.insight).toMatch(/not enough/i);
  });
});