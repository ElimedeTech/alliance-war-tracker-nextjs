import { Battlegroup } from '@/types';

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
  // Split mode: 18 paths × 2 nodes each = 36 path nodes per BG.
  // Single mode: 9 paths × 4 nodes each (one player covers both sections) = 36 path nodes per BG.
  // Both modes sum to 50 nodes per BG (36 paths + 13 MBs + 1 boss).
  const pathNodeCount       = pathAssignmentMode === 'single' ? 4 : 2;
  const inProgressNodeCount = pathAssignmentMode === 'single' ? 2 : 1;

  let totalDeaths = 0;
  let nodesCleared = 0;
  let totalBonus = 0;

  (battlegroup.paths || []).forEach(path => {
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