import { War, Player, PlayerPerformance, AllianceData, Battlegroup } from '@/types';
import { getCountablePaths, fightsPerPathRecord } from '@/lib/calculations';

/**
 * Calculate player performance for a specific war.
 * Tracks path fights, MB fights, deaths, and other metrics.
 *
 * NOTE: Fights per path record depend on assignment mode:
 *   - Split mode:  one record = one section = 2 fights (one player covers their section; a different player may cover the other section's record)
 *   - Single mode: one record = the full path = 4 fights (one player owns all 4 nodes)
 * This mirrors pathNodeCount in calculateBgStats (calculations.ts).
 */
export const calculatePlayerWarPerformance = (
  war: War,
  seasonId: string,
  players: Player[],
  pathAssignmentMode: 'split' | 'single' = 'split'
): PlayerPerformance[] => {
  // fightsPerPathRecord and getCountablePaths are the single source of truth
  // for how paths are counted. Never inline this logic here.
  const totalFightsPerPath = fightsPerPathRecord(pathAssignmentMode);

  const performanceMap = new Map<string, PlayerPerformance>();

  // Initialize performance objects for each player (active + archived)
  players.forEach(player => {
    performanceMap.set(player.id, {
      id: `perf-${war.id}-${player.id}-${Date.now()}`,
      playerId: player.id,
      warId: war.id,
      seasonId,
      pathFights: 0,
      mbFights: 0,
      bossFights: 0,
      totalFights: 0,
      pathDeaths: 0,
      mbDeaths: 0,
      bossDeaths: 0,
      totalDeaths: 0,
      averageDeathsPerFight: 0,
      perfectClears: 0,
      backupAssists: 0,
      noShowCovers: 0,
    });
  });

  // Process each battlegroup
  war.battlegroups.forEach((bg: Battlegroup) => {
    // Process paths — use canonical filter so sec-2 is skipped in single mode
    getCountablePaths(bg.paths || [], pathAssignmentMode).forEach(path => {
      // Primary player
      if (path.assignedPlayerId && performanceMap.has(path.assignedPlayerId)) {
        const perf = performanceMap.get(path.assignedPlayerId)!;
        const d = path.primaryDeaths ?? 0;
        const backupFights = path.backupHelped ? (path.backupFights ?? 1) : 0;
        const primaryFights = totalFightsPerPath - backupFights;
        perf.pathFights += primaryFights;
        perf.totalFights += primaryFights;
        perf.pathDeaths += d;
        perf.totalDeaths += d;
        if (d === 0) perf.perfectClears++;
      }

      // Backup player (if helped)
      if (path.backupHelped && path.backupPlayerId && performanceMap.has(path.backupPlayerId)) {
        const perf = performanceMap.get(path.backupPlayerId)!;
        const d = path.backupDeaths ?? 0;
        const backupFights = path.backupFights ?? 1;
        perf.pathFights += backupFights;
        perf.totalFights += backupFights;
        perf.pathDeaths += d;
        perf.totalDeaths += d;
        perf.backupAssists++;
        if (d === 0) perf.perfectClears++;
      }

      // Replacement player (if no-show)
      if (path.playerNoShow && path.replacedByPlayerId && performanceMap.has(path.replacedByPlayerId)) {
        const perf = performanceMap.get(path.replacedByPlayerId)!;
        perf.pathFights += totalFightsPerPath;
        perf.totalFights += totalFightsPerPath;
        perf.noShowCovers++;
      }
    });

    // Process mini bosses
    (bg.miniBosses || []).forEach(mb => {
      // Primary player
      if (mb.assignedPlayerId && performanceMap.has(mb.assignedPlayerId)) {
        const perf = performanceMap.get(mb.assignedPlayerId)!;
        const d = mb.primaryDeaths ?? 0;
        perf.mbFights++;
        perf.totalFights++;
        perf.mbDeaths += d;
        perf.totalDeaths += d;
        if (d === 0) perf.perfectClears++;
      }

      // Backup player (if helped)
      if (mb.backupHelped && mb.backupPlayerId && performanceMap.has(mb.backupPlayerId)) {
        const perf = performanceMap.get(mb.backupPlayerId)!;
        const d = mb.backupDeaths ?? 0;
        perf.mbFights++;
        perf.totalFights++;
        perf.mbDeaths += d;
        perf.totalDeaths += d;
        perf.backupAssists++;
        if (d === 0) perf.perfectClears++;
      }

      // Replacement player (if no-show)
      if (mb.playerNoShow && mb.replacedByPlayerId && performanceMap.has(mb.replacedByPlayerId)) {
        const perf = performanceMap.get(mb.replacedByPlayerId)!;
        perf.mbFights++;
        perf.totalFights++;
        perf.noShowCovers++;
      }
    });

    // Process boss
    if (bg.boss) {
      if (bg.boss.assignedPlayerId && performanceMap.has(bg.boss.assignedPlayerId)) {
        const perf = performanceMap.get(bg.boss.assignedPlayerId)!;
        perf.bossFights++;
        perf.totalFights++;
        const d = (bg.boss.primaryDeaths ?? 0) + (bg.boss.backupHelped ? (bg.boss.backupDeaths ?? 0) : 0);
        perf.bossDeaths += d;
        perf.totalDeaths += d;
        if (d === 0) perf.perfectClears++;
      }
    }
  });

  // Calculate average deaths per fight
  performanceMap.forEach(perf => {
    if (perf.totalFights > 0) {
      perf.averageDeathsPerFight = Math.round((perf.totalDeaths / perf.totalFights) * 100) / 100;
    }
  });

  return Array.from(performanceMap.values());
};

/**
 * Get aggregated season stats for a player.
 * Sums up all performances for wars in a season.
 */
export const getPlayerSeasonStats = (
  playerId: string,
  seasonId: string,
  performances: PlayerPerformance[]
) => {
  const seasonPerformances = performances.filter(
    p => p.playerId === playerId && p.seasonId === seasonId
  );

  const stats = {
    pathFights: 0,
    mbFights: 0,
    bossFights: 0,
    totalFights: 0,
    pathDeaths: 0,
    mbDeaths: 0,
    bossDeaths: 0,
    totalDeaths: 0,
    averageDeathsPerFight: 0,
    perfectClears: 0,
    backupAssists: 0,
    noShowCovers: 0,
    warsParticipated: 0,
  };

  seasonPerformances.forEach(perf => {
    stats.pathFights += perf.pathFights;
    stats.mbFights += perf.mbFights;
    stats.bossFights += perf.bossFights;
    stats.totalFights += perf.totalFights;
    stats.pathDeaths += perf.pathDeaths;
    stats.mbDeaths += perf.mbDeaths;
    stats.bossDeaths += perf.bossDeaths;
    stats.totalDeaths += perf.totalDeaths;
    stats.perfectClears += perf.perfectClears;
    stats.backupAssists += perf.backupAssists;
    stats.noShowCovers += perf.noShowCovers;
    stats.warsParticipated++;
  });

  if (stats.totalFights > 0) {
    stats.averageDeathsPerFight = Math.round((stats.totalDeaths / stats.totalFights) * 100) / 100;
  }

  return stats;
};

/**
 * Get aggregated all-time stats for a player.
 * Sums up all performances across all seasons.
 */
export const getPlayerAllTimeStats = (
  playerId: string,
  performances: PlayerPerformance[]
) => {
  const playerPerformances = performances.filter(p => p.playerId === playerId);

  const stats = {
    pathFights: 0,
    mbFights: 0,
    bossFights: 0,
    totalFights: 0,
    pathDeaths: 0,
    mbDeaths: 0,
    bossDeaths: 0,
    totalDeaths: 0,
    averageDeathsPerFight: 0,
    perfectClears: 0,
    backupAssists: 0,
    noShowCovers: 0,
    warsParticipated: 0,
    seasonsParticipated: new Set<string>(),
  };

  playerPerformances.forEach(perf => {
    stats.pathFights += perf.pathFights;
    stats.mbFights += perf.mbFights;
    stats.bossFights += perf.bossFights;
    stats.totalFights += perf.totalFights;
    stats.pathDeaths += perf.pathDeaths;
    stats.mbDeaths += perf.mbDeaths;
    stats.bossDeaths += perf.bossDeaths;
    stats.totalDeaths += perf.totalDeaths;
    stats.perfectClears += perf.perfectClears;
    stats.backupAssists += perf.backupAssists;
    stats.noShowCovers += perf.noShowCovers;
    stats.warsParticipated++;
    stats.seasonsParticipated.add(perf.seasonId);
  });

  if (stats.totalFights > 0) {
    stats.averageDeathsPerFight = Math.round((stats.totalDeaths / stats.totalFights) * 100) / 100;
  }

  return {
    ...stats,
    seasonsParticipated: stats.seasonsParticipated.size,
  };
};

/**
 * Helper to compute and apply aggregate stats to a single player object.
 */
const applyAggregateStats = (
  player: Player,
  data: AllianceData
): Player => {
  const allTimeStats = getPlayerAllTimeStats(player.id, data.playerPerformances || []);

  const seasonStats: Record<string, any> = {};
  (data.seasons || []).forEach(season => {
    const s = getPlayerSeasonStats(player.id, season.id, data.playerPerformances || []);
    seasonStats[season.id] = {
      pathFights: s.pathFights,
      mbFights: s.mbFights,
      totalDeaths: s.totalDeaths,
      warsParticipated: s.warsParticipated,
    };
  });

  return {
    ...player,
    pathFights: allTimeStats.pathFights,
    mbFights: allTimeStats.mbFights,
    totalDeaths: allTimeStats.totalDeaths,
    warsParticipated: allTimeStats.warsParticipated,
    seasonStats,
  };
};

/**
 * Update player aggregate stats from performance data.
 * Covers both active players and archivedPlayers so departed player
 * stats remain accurate in historical views.
 */
export const updatePlayerAggregateStats = (
  data: AllianceData
): AllianceData => {
  const updatedPlayers = data.players.map(p => applyAggregateStats(p, data));

  // Also keep archivedPlayers stats up to date — they still appear in
  // historical war views and season analytics
  const updatedArchived = (data.archivedPlayers || []).map(p => applyAggregateStats(p, data));

  return {
    ...data,
    players: updatedPlayers,
    archivedPlayers: updatedArchived,
  };
};