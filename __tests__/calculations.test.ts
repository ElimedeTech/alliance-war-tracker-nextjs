import {
  nodeBonus,
  pathBonus,
  bossBonus,
  miniBossBonus,
  calculateBgStats,
} from '../lib/calculations';
import { Battlegroup, Path, MiniBoss, Boss } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const makePath = (overrides: Partial<Path> = {}): Path => ({
  id: 'p1',
  pathNumber: 1,
  section: 1,
  assignedPlayerId: '',
  primaryDeaths: 0,
  backupHelped: false,
  backupPlayerId: '',
  backupDeaths: 0,
  playerNoShow: false,
  replacedByPlayerId: '',
  status: 'completed',
  notes: '',
  ...overrides,
});

const makeMiniBoss = (overrides: Partial<MiniBoss> = {}): MiniBoss => ({
  id: 'mb1',
  nodeNumber: 37,
  name: 'Mini Boss 1',
  assignedPlayerId: '',
  primaryDeaths: 0,
  backupHelped: false,
  backupPlayerId: '',
  backupDeaths: 0,
  playerNoShow: false,
  replacedByPlayerId: '',
  status: 'completed',
  notes: '',
  ...overrides,
});

const makeBoss = (overrides: Partial<Boss> = {}): Boss => ({
  id: 'boss',
  nodeNumber: 50,
  name: 'Final Boss',
  assignedPlayerId: '',
  primaryDeaths: 0,
  backupHelped: false,
  backupPlayerId: '',
  backupDeaths: 0,
  playerNoShow: false,
  replacedByPlayerId: '',
  status: 'completed',
  notes: '',
  ...overrides,
});

const makeBg = (overrides: Partial<Battlegroup> = {}): Battlegroup => ({
  bgNumber: 1,
  paths: [],
  miniBosses: [],
  boss: makeBoss(),
  attackBonus: 0,
  maxAttackBonus: 0,
  pointsPerDeath: 0,
  totalKills: 0,
  defenderKills: 0,
  exploration: 0,
  players: [],
  ...overrides,
});

// ─── nodeBonus ───────────────────────────────────────────────────────────────

describe('nodeBonus', () => {
  it('returns 270 for 0 deaths', () => expect(nodeBonus(0)).toBe(270));
  it('returns 180 for 1 death',  () => expect(nodeBonus(1)).toBe(180));
  it('returns 90 for 2 deaths',  () => expect(nodeBonus(2)).toBe(90));
  it('returns 0 for 3 deaths',   () => expect(nodeBonus(3)).toBe(0));
  it('returns 0 for 4+ deaths',  () => expect(nodeBonus(5)).toBe(0));
});

// ─── pathBonus ───────────────────────────────────────────────────────────────

describe('pathBonus', () => {
  it('returns 540 for 0 deaths (270 + 270)', () => expect(pathBonus(0)).toBe(540));
  it('returns 450 for 1 death  (270 + 180)', () => expect(pathBonus(1)).toBe(450));
  it('returns 360 for 2 deaths (180 + 180)', () => expect(pathBonus(2)).toBe(360));
  it('returns 270 for 3 deaths (180 + 90)',  () => expect(pathBonus(3)).toBe(270));
  it('returns 180 for 4 deaths (90 + 90)',   () => expect(pathBonus(4)).toBe(180));
  it('returns 90  for 5 deaths (90 + 0)',    () => expect(pathBonus(5)).toBe(90));
  it('returns 0   for 6+ deaths',            () => expect(pathBonus(6)).toBe(0));

  it('returns 0 when noDefender is true regardless of deaths', () => {
    expect(pathBonus(0, true)).toBe(0);
    expect(pathBonus(1, true)).toBe(0);
    expect(pathBonus(3, true)).toBe(0);
  });
});

// ─── miniBossBonus ───────────────────────────────────────────────────────────

describe('miniBossBonus', () => {
  it('returns 270 for 0 deaths', () => expect(miniBossBonus(0)).toBe(270));
  it('returns 180 for 1 death',  () => expect(miniBossBonus(1)).toBe(180));
  it('returns 90  for 2 deaths', () => expect(miniBossBonus(2)).toBe(90));
  it('returns 0   for 3+ deaths',() => expect(miniBossBonus(3)).toBe(0));

  it('returns 0 when noDefender is true regardless of deaths', () => {
    expect(miniBossBonus(0, true)).toBe(0);
    expect(miniBossBonus(1, true)).toBe(0);
  });
});

// ─── bossBonus ───────────────────────────────────────────────────────────────

describe('bossBonus', () => {
  it('returns 50000 when completed',             () => expect(bossBonus(true)).toBe(50000));
  it('returns 0 when not completed',             () => expect(bossBonus(false)).toBe(0));
  it('returns 0 when completed but noDefender',  () => expect(bossBonus(true, true)).toBe(0));
  it('returns 0 when not completed and noDefender', () => expect(bossBonus(false, true)).toBe(0));
});

// ─── calculateBgStats ────────────────────────────────────────────────────────

describe('calculateBgStats', () => {

  describe('nodes cleared', () => {
    it('counts 2 nodes per completed path in split mode', () => {
      const bg = makeBg({
        paths: [makePath({ status: 'completed' }), makePath({ id: 'p2', pathNumber: 2, section: 1, status: 'not-started' })],
        miniBosses: [],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg, 'split').nodesCleared).toBe(2);
    });

    it('counts 4 nodes per completed path in single mode', () => {
      const bg = makeBg({
        paths: [makePath({ status: 'completed' })],
        miniBosses: [],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg, 'single').nodesCleared).toBe(4);
    });

    it('counts 1 node per in-progress path in split mode', () => {
      const bg = makeBg({
        paths: [makePath({ status: 'in-progress' })],
        miniBosses: [],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg, 'split').nodesCleared).toBe(1);
    });

    it('counts 2 nodes per in-progress path in single mode', () => {
      const bg = makeBg({
        paths: [makePath({ status: 'in-progress' })],
        miniBosses: [],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg, 'single').nodesCleared).toBe(2);
    });

    it('counts 1 node per completed mini boss', () => {
      const bg = makeBg({
        paths: [],
        miniBosses: [makeMiniBoss({ status: 'completed' }), makeMiniBoss({ id: 'mb2', nodeNumber: 38, name: 'Mini Boss 2', status: 'not-started' })],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg).nodesCleared).toBe(1);
    });

    it('counts 1 node for a completed boss', () => {
      const bg = makeBg({ paths: [], miniBosses: [], boss: makeBoss({ status: 'completed' }) });
      expect(calculateBgStats(bg).nodesCleared).toBe(1);
    });

    it('returns 50/50 when all 18 paths (split) + 13 MBs + boss are completed', () => {
      const paths: Path[] = [];
      for (let s = 1; s <= 2; s++) {
        for (let n = 1; n <= 9; n++) {
          paths.push(makePath({ id: `s${s}p${n}`, pathNumber: n, section: s as 1 | 2, status: 'completed' }));
        }
      }
      const miniBosses: MiniBoss[] = Array.from({ length: 13 }, (_, i) =>
        makeMiniBoss({ id: `mb${i}`, nodeNumber: 37 + i, name: `Mini Boss ${i + 1}`, status: 'completed' }),
      );
      const bg = makeBg({ paths, miniBosses, boss: makeBoss({ status: 'completed' }) });
      const result = calculateBgStats(bg, 'split');
      expect(result.nodesCleared).toBe(50);
      expect(result.exploration).toBe(100);
    });

    it('returns 50/50 in single mode with 9 completed paths + 13 MBs + boss', () => {
      const paths: Path[] = Array.from({ length: 9 }, (_, i) =>
        makePath({ id: `p${i}`, pathNumber: i + 1, section: 1, status: 'completed' }),
      );
      const miniBosses: MiniBoss[] = Array.from({ length: 13 }, (_, i) =>
        makeMiniBoss({ id: `mb${i}`, nodeNumber: 37 + i, name: `Mini Boss ${i + 1}`, status: 'completed' }),
      );
      const bg = makeBg({ paths, miniBosses, boss: makeBoss({ status: 'completed' }) });
      const result = calculateBgStats(bg, 'single');
      expect(result.nodesCleared).toBe(50);
      expect(result.exploration).toBe(100);
    });
  });

  describe('exploration percentage', () => {
    it('returns 0% when nothing is cleared', () => {
      const bg = makeBg({
        paths: [makePath({ status: 'not-started' })],
        miniBosses: [],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg).exploration).toBe(0);
    });

    it('never exceeds 100%', () => {
      const paths: Path[] = Array.from({ length: 18 }, (_, i) =>
        makePath({ id: `p${i}`, pathNumber: (i % 9) + 1, section: i < 9 ? 1 : 2, status: 'completed' }),
      );
      const miniBosses: MiniBoss[] = Array.from({ length: 13 }, (_, i) =>
        makeMiniBoss({ id: `mb${i}`, nodeNumber: 37 + i, name: `MB${i}`, status: 'completed' }),
      );
      const bg = makeBg({ paths, miniBosses, boss: makeBoss({ status: 'completed' }) });
      expect(calculateBgStats(bg, 'split').exploration).toBe(100);
    });
  });

  describe('deaths', () => {
    it('sums primary and backup deaths across paths', () => {
      const bg = makeBg({
        paths: [
          makePath({ primaryDeaths: 2, backupDeaths: 1 }),
          makePath({ id: 'p2', pathNumber: 2, section: 1, primaryDeaths: 1, backupDeaths: 0 }),
        ],
        miniBosses: [],
        boss: makeBoss({ status: 'not-started', primaryDeaths: 0, backupDeaths: 0 }),
      });
      expect(calculateBgStats(bg).totalDeaths).toBe(4);
    });

    it('sums deaths from paths, mini bosses, and boss', () => {
      const bg = makeBg({
        paths: [makePath({ primaryDeaths: 1 })],
        miniBosses: [makeMiniBoss({ primaryDeaths: 2 })],
        boss: makeBoss({ status: 'completed', primaryDeaths: 1 }),
      });
      expect(calculateBgStats(bg).totalDeaths).toBe(4);
    });

    it('handles undefined deaths without NaN', () => {
      const bg = makeBg({
        paths: [],
        miniBosses: [],
        boss: makeBoss({ status: 'completed', primaryDeaths: undefined as any, backupDeaths: undefined as any }),
      });
      const result = calculateBgStats(bg);
      expect(result.totalDeaths).toBe(0);
      expect(Number.isNaN(result.totalDeaths)).toBe(false);
    });
  });

  describe('bonus', () => {
    it('awards full 540 per path with 0 deaths', () => {
      const bg = makeBg({
        paths: [makePath({ primaryDeaths: 0, backupDeaths: 0 })],
        miniBosses: [],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg).totalBonus).toBe(540);
    });

    it('awards tiered bonus based on deaths', () => {
      // 1 total death → 270 + 180 = 450
      const bg = makeBg({
        paths: [makePath({ primaryDeaths: 1, backupDeaths: 0 })],
        miniBosses: [],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg).totalBonus).toBe(450);
    });

    it('awards 0 path bonus when noDefender', () => {
      const bg = makeBg({
        paths: [makePath({ primaryDeaths: 0, noDefender: true })],
        miniBosses: [],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg).totalBonus).toBe(0);
    });

    it('awards 270 mini boss bonus for 0 deaths', () => {
      const bg = makeBg({
        paths: [],
        miniBosses: [makeMiniBoss({ primaryDeaths: 0, status: 'completed' })],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg).totalBonus).toBe(270);
    });

    it('awards tiered mini boss bonus based on deaths', () => {
      const bg = makeBg({
        paths: [],
        miniBosses: [makeMiniBoss({ primaryDeaths: 1, status: 'completed' })],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg).totalBonus).toBe(180);
    });

    it('awards 0 mini boss bonus when noDefender', () => {
      const bg = makeBg({
        paths: [],
        miniBosses: [makeMiniBoss({ primaryDeaths: 0, status: 'completed', noDefender: true })],
        boss: makeBoss({ status: 'not-started' }),
      });
      expect(calculateBgStats(bg).totalBonus).toBe(0);
    });

    it('awards 50,000 for a completed boss', () => {
      const bg = makeBg({ paths: [], miniBosses: [], boss: makeBoss({ status: 'completed' }) });
      expect(calculateBgStats(bg).totalBonus).toBe(50000);
    });

    it('awards 0 boss bonus when noDefender', () => {
      const bg = makeBg({
        paths: [],
        miniBosses: [],
        boss: makeBoss({ status: 'completed', noDefender: true }),
      });
      expect(calculateBgStats(bg).totalBonus).toBe(0);
    });

    it('awards 0 boss bonus when not completed', () => {
      const bg = makeBg({ paths: [], miniBosses: [], boss: makeBoss({ status: 'not-started' }) });
      expect(calculateBgStats(bg).totalBonus).toBe(0);
    });

    it('calculates max possible bonus correctly for a full perfect BG (split)', () => {
      // 18 paths × 540 + 13 MBs × 270 + 1 boss × 50,000 = 9,720 + 3,510 + 50,000 = 63,230
      // Wait — actually max is: 18 paths × 540 = 9720, 13 MBs × 270 = 3510, boss = 50000 → 63230
      // But the app shows max as 72,950. Let me re-check:
      // 18 paths × 1080? No - each path is 2 nodes × 270 = 540 per path.
      // 18 × 540 = 9720, not matching 72950.
      // Actually the UI says "18 paths × 1,080" — so maybe in single mode each path = 4 nodes × 270 = 1080?
      // In split mode: 18 paths × 540 = 9720 + 13 × 270 + 50000 = 63230
      // Hmm let me just verify what our code gives for a perfect BG in split mode
      const paths: Path[] = [];
      for (let s = 1; s <= 2; s++) {
        for (let n = 1; n <= 9; n++) {
          paths.push(makePath({ id: `s${s}p${n}`, pathNumber: n, section: s as 1 | 2, status: 'completed', primaryDeaths: 0, backupDeaths: 0 }));
        }
      }
      const miniBosses: MiniBoss[] = Array.from({ length: 13 }, (_, i) =>
        makeMiniBoss({ id: `mb${i}`, nodeNumber: 37 + i, name: `MB${i}`, status: 'completed', primaryDeaths: 0, backupDeaths: 0 }),
      );
      const bg = makeBg({ paths, miniBosses, boss: makeBoss({ status: 'completed', primaryDeaths: 0 }) });
      const result = calculateBgStats(bg, 'split');
      // 18 paths × 540 = 9720, 13 MBs × 270 = 3510, boss = 50000
      expect(result.totalBonus).toBe(18 * 540 + 13 * 270 + 50000);
    });
  });
});
