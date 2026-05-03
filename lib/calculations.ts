import { Battlegroup, Path } from '@/types';

/**
 * Path model — applies to BOTH modes:
 *   - Every path always has 4 nodes split across 2 sections (2 nodes each).
 *   - Split mode:  each section record belongs to a different player (2 fights each).
 *   - Single mode: one player owns both sections (4 fights); sec-2 is a sync copy of sec-1.
 *
 * These two functions are the SINGLE authoritative source for path filtering and
 * fight counting. Every computation in the app (seasonAnalytics, performanceCalculator,
 * StatsModal, WarComparisonDashboard) must call these instead of implementing its own logic.
 */

/**
 * Returns only the path records that should be counted for a given mode.
 * - Split:  all 18 records (9 sec-1 + 9 sec-2), each 2 nodes/fights.
 * - Single: only 9 sec-1 records; sec-2 records are sync copies and must be skipped.
 */
export const getCountablePaths = (paths: Path[], mode: 'split' | 'single'): Path[] =>
  mode === 'single'
    ? paths.filter(p => (p.section ?? 1) !== 2)
    : paths;

/**
 * Returns the number of fights (nodes) credited per path record.
 * - Split:  2 (one section = 2 nodes, one player).
 * - Single: 4 (full path = 4 nodes, one player owns both sections).
 */
export const fightsPerPathRecord = (mode: 'split' | 'single'): number =>
  mode === 'single' ? 4 : 2;



/** Points awarded for a single node based on deaths */
export const nodeBonus = (deaths: number): number => {
  if (deaths === 0) return 270;
  if (deaths === 1) return 180;
  if (deaths === 2) return 90;
  return 0;
};

/**
 * Points awarded for a path.
 * nodeCount = 2 (split mode) or 4 (single mode).
 * Deaths are distributed as evenly as possible across nodes (ceiling first).
 */
export const pathBonus = (totalDeaths: number, noDefender = false, nodeCount = 2): number => {
  if (noDefender) return 0;
  let bonus = 0;
  let remaining = totalDeaths;
  for (let i = 0; i < nodeCount; i++) {
    const nodesLeft = nodeCount - i;
    const d = Math.ceil(remaining / nodesLeft);
    remaining -= d;
    bonus += nodeBonus(d);
  }
  return bonus;
};

/** Points awarded for the final boss */
export const bossBonus = (completed: boolean, noDefender = false): number => {
  if (!completed || noDefender) return 0;
  return 50000;
};

/** Mini boss bonus — same tiers as a single node */
export const miniBossBonus = (deaths: number, noDefender = false): number => {
  if (noDefender) return 0;
  return nodeBonus(deaths);
};

/**
 * Full BG stat calculation.
 * Returns nodesCleared (out of 50), totalDeaths, totalBonus, and exploration %.
 */
export const calculateBgStats = (
  battlegroup: Battlegroup,
  pathAssignmentMode: 'split' | 'single' = 'split',
) => {
  // Single mode: count only section-1 path records × 4 nodes each.
  //   Works for old wars (9 sec-1 records only) and new wars (18 records where
  //   sec-2 is a status-sync copy) — sec-1 × 4 = 36 path nodes in both cases.
  // Split mode: count all 18 records × 2 nodes each = 36 path nodes.
  // Both modes → 36 path nodes + 13 MBs + 1 boss = 50 per BG.

  let totalDeaths = 0;
  let nodesCleared = 0;
  let totalBonus = 0;

  const allPaths = battlegroup.paths || [];
  const countedPaths = pathAssignmentMode === 'single'
    ? allPaths.filter(p => (p.section ?? 1) !== 2)  // sec-1 only
    : allPaths;
  const pathNodeCount       = pathAssignmentMode === 'single' ? 4 : 2;
  const inProgressNodeCount = pathAssignmentMode === 'single' ? 2 : 1;

  countedPaths.forEach(path => {
    const d = (path.primaryDeaths ?? 0) + (path.backupDeaths ?? 0);
    totalDeaths += d;
    if (path.status === 'completed') nodesCleared += pathNodeCount;
    else if (path.status === 'in-progress') nodesCleared += inProgressNodeCount;
    totalBonus += pathBonus(d, path.noDefender, pathNodeCount);
  });

  (battlegroup.miniBosses || []).forEach(mb => {
    const d = (mb.primaryDeaths ?? 0) + (mb.backupDeaths ?? 0);
    totalDeaths += d;
    if (mb.status === 'completed') nodesCleared += 1;
    totalBonus += miniBossBonus(d, mb.noDefender);
  });

  if (battlegroup.boss) {
    const d = (battlegroup.boss.primaryDeaths ?? 0) + (battlegroup.boss.backupDeaths ?? 0);
    totalDeaths += d;
    if (battlegroup.boss.status === 'completed') {
      nodesCleared += 1;
      totalBonus += bossBonus(true, battlegroup.boss.noDefender);
    }
  }

  const exploration = Math.min(100, Math.round((nodesCleared / 50) * 100));

  return { totalDeaths, nodesCleared, totalBonus, exploration };
};