import { War, Player, PlayerPerformance, AllianceData, Battlegroup } from '@/types';

/**
 * Calculate player performance for a specific war
 * Tracks path fights, MB fights, deaths, and other metrics
 */
export const calculatePlayerWarPerformance = (
  war: War,
  seasonId: string,
  players: Player[]
): PlayerPerformance[] => {
  const performanceMap = new Map<string, PlayerPerformance>();

  // Initialize performance objects for each player
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
    // Process paths
    (bg.paths || []).forEach(path => {
      // Primary player
      if (path.assignedPlayerId && performanceMap.has(path.assignedPlayerId)) {
        const perf = performanceMap.get(path.assignedPlayerId)!;
        perf.pathFights++;
        perf.totalFights++;
        perf.pathDeaths += path.primaryDeaths;
        perf.totalDeaths += path.primaryDeaths;
        if (path.primaryDeaths === 0) perf.perfectClears++;
      }

      // Backup player (if helped)
      if (path.backupHelped && path.backupPlayerId && performanceMap.has(path.backupPlayerId)) {
        const perf = performanceMap.get(path.backupPlayerId)!;
        perf.pathFights++;
        perf.totalFights++;
        perf.pathDeaths += path.backupDeaths;
        perf.totalDeaths += path.backupDeaths;
        perf.backupAssists++;
        if (path.backupDeaths === 0) perf.perfectClears++;
      }

      // Replacement player (if no-show)
      if (path.playerNoShow && path.replacedByPlayerId && performanceMap.has(path.replacedByPlayerId)) {
        const perf = performanceMap.get(path.replacedByPlayerId)!;
        perf.pathFights++;
        perf.totalFights++;
        perf.noShowCovers++;
      }
    });

    // Process mini bosses
    (bg.miniBosses || []).forEach(mb => {
      // Primary player
      if (mb.assignedPlayerId && performanceMap.has(mb.assignedPlayerId)) {
        const perf = performanceMap.get(mb.assignedPlayerId)!;
        perf.mbFights++;
        perf.totalFights++;
        perf.mbDeaths += mb.primaryDeaths;
        perf.totalDeaths += mb.primaryDeaths;
        if (mb.primaryDeaths === 0) perf.perfectClears++;
      }

      // Backup player (if helped)
      if (mb.backupHelped && mb.backupPlayerId && performanceMap.has(mb.backupPlayerId)) {
        const perf = performanceMap.get(mb.backupPlayerId)!;
        perf.mbFights++;
        perf.totalFights++;
        perf.mbDeaths += mb.backupDeaths;
        perf.totalDeaths += mb.backupDeaths;
        perf.backupAssists++;
        if (mb.backupDeaths === 0) perf.perfectClears++;
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
        perf.bossDeaths += bg.boss.primaryDeaths + bg.boss.backupDeaths;
        perf.totalDeaths += bg.boss.primaryDeaths + bg.boss.backupDeaths;
        if ((bg.boss.primaryDeaths + bg.boss.backupDeaths) === 0) perf.perfectClears++;
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
 * Get aggregated season stats for a player
 * Sums up all performances for wars in a season
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
 * Get aggregated all-time stats for a player
 * Sums up all performances across all seasons
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
 * Update player aggregate stats from performance data
 */
export const updatePlayerAggregateStats = (
  data: AllianceData
): AllianceData => {
  const updatedPlayers = data.players.map(player => {
    const allTimeStats = getPlayerAllTimeStats(player.id, data.playerPerformances || []);

    // Build per-season stats
    const seasonStats: Record<string, any> = {};
    (data.seasons || []).forEach(season => {
      const seasonStats_data = getPlayerSeasonStats(player.id, season.id, data.playerPerformances || []);
      seasonStats[season.id] = {
        pathFights: seasonStats_data.pathFights,
        mbFights: seasonStats_data.mbFights,
        totalDeaths: seasonStats_data.totalDeaths,
        warsParticipated: seasonStats_data.warsParticipated,
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
  });

  return {
    ...data,
    players: updatedPlayers,
  };
};
