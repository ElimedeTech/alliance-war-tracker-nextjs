/**
 * seasonAnalytics.ts
 *
 * Pure computation layer — no Firebase reads, no React, no side effects.
 * Pass in your existing `War[]` and `Player[]` from AllianceData and
 * get back rich analytics that mirror CereBro's season overview patterns.
 *
 * Works entirely with your EXISTING data structure — zero schema changes needed.
 */

import { War, Player } from "@/types";

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface DeathDistribution {
  path: number;
  miniBoss: number;
  boss: number;
  total: number;
}

export interface FightRecord {
  nodeLabel: string;     // e.g. "S1 Path 3", "Mini Boss 5", "Boss"
  nodeType: "path" | "mini-boss" | "boss";
  nodeNumber: number;    // raw nodeNumber (paths use a synthetic value)
  bgNumber: number;
  deaths: number;
  wasBackup: boolean;
  wasNoShow: boolean;
}

export interface PlayerWarRecord {
  warId: string;
  warName: string;
  warNumber: number;     // index + 1 for display
  result: "win" | "loss" | "tie" | "pending";
  bgNumber: number;
  fights: number;
  deaths: number;
  pathFights: number;
  pathDeaths: number;
  miniBossFights: number;
  miniBossDeaths: number;
  bossFights: number;
  bossDeaths: number;
  soloRate: number;      // 0–100
  fightDetails: FightRecord[];
}

export interface PlayerSeasonStats {
  playerId: string;
  playerName: string;
  bgNumber: number;      // 0-indexed, matching your bgAssignment field
  warHistory: PlayerWarRecord[];
  // Aggregated totals
  totalFights: number;
  totalDeaths: number;
  totalPathFights: number;
  totalPathDeaths: number;
  totalMiniBossFights: number;
  totalMiniBossDeaths: number;
  totalBossFights: number;
  totalBossDeaths: number;
  overallSoloRate: number;  // 0–100
  warsParticipated: number;
}

export interface NodeHeatEntry {
  nodeLabel: string;
  nodeType: "path" | "mini-boss" | "boss";
  nodeNumber: number;
  bgNumber: number;
  fights: number;
  deaths: number;
  deathRate: number;    // 0–100 (deaths / fights * 100)
}

export interface SeasonAnalytics {
  totalWars: number;
  wins: number;
  losses: number;
  draws: number;
  pending: number;
  winRate: number;      // 0–100

  globalFights: number;
  globalDeaths: number;
  globalSoloRate: number;  // 0–100

  deathDistribution: DeathDistribution;

  playerStats: PlayerSeasonStats[];

  // Top 10 hardest nodes by deaths
  hardestNodes: NodeHeatEntry[];

  // Per-BG totals (bgNumber 1, 2, 3)
  bgTotals: Record<number, { fights: number; deaths: number; soloRate: number }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resultToCategory(result: string): "win" | "loss" | "tie" | "pending" {
  if (result === "win") return "win";
  if (result === "loss") return "loss";
  if (result === "tie" || result === "draw") return "tie";
  return "pending";
}

/**
 * Synthetic node number for paths — keeps them sortable.
 * S1 Path 1 → 101, S1 Path 9 → 109, S2 Path 1 → 201, etc.
 */
function pathNodeNumber(section: number, pathNumber: number): number {
  return section * 100 + pathNumber;
}

// ─── Core Aggregation ─────────────────────────────────────────────────────────

export function computeSeasonAnalytics(
  wars: War[],
  players: Player[]
): SeasonAnalytics {
  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

  // Player stat accumulators — keyed by playerId
  const playerAccum = new Map<
    string,
    {
      bgNumber: number;
      warHistory: PlayerWarRecord[];
    }
  >();

  const nodeAccum = new Map<string, NodeHeatEntry>();

  const bgTotals: Record<number, { fights: number; deaths: number }> = {
    1: { fights: 0, deaths: 0 },
    2: { fights: 0, deaths: 0 },
    3: { fights: 0, deaths: 0 },
  };

  const deathDist: DeathDistribution = { path: 0, miniBoss: 0, boss: 0, total: 0 };
  let wins = 0, losses = 0, draws = 0, pending = 0;

  for (let warIdx = 0; warIdx < wars.length; warIdx++) {
    const war = wars[warIdx];
    const result = resultToCategory(war.allianceResult || "pending");
    if (result === "win") wins++;
    else if (result === "loss") losses++;
    else if (result === "tie") draws++;
    else pending++;

    for (const bg of war.battlegroups ?? []) {
      const bgNum = bg.bgNumber; // 1, 2, 3

      // Collect all participants touched in this war for this BG
      // Maps playerId → their PlayerWarRecord for this war
      const warPlayerMap = new Map<string, PlayerWarRecord>();

      const getOrCreateWarRecord = (playerId: string): PlayerWarRecord => {
        if (!warPlayerMap.has(playerId)) {
          const player = playerMap.get(playerId);
          warPlayerMap.set(playerId, {
            warId: war.id,
            warName: war.name || `War ${warIdx + 1}`,
            warNumber: warIdx + 1,
            result,
            bgNumber: bgNum,
            fights: 0,
            deaths: 0,
            pathFights: 0,
            pathDeaths: 0,
            miniBossFights: 0,
            miniBossDeaths: 0,
            bossFights: 0,
            bossDeaths: 0,
            soloRate: 0,
            fightDetails: [],
          });
        }
        return warPlayerMap.get(playerId)!;
      };

      // ── Paths ──────────────────────────────────────────────────────────────
      for (const path of bg.paths ?? []) {
        const section = path.section ?? 1;
        const pathNum = path.pathNumber ?? 1;
        const nodeNum = pathNodeNumber(section, pathNum);
        const nodeKey = `bg${bgNum}-s${section}-p${pathNum}`;
        const nodeLabel = `BG${bgNum} S${section} Path ${pathNum}`;

        // Primary player
        if (path.assignedPlayerId) {
          const rec = getOrCreateWarRecord(path.assignedPlayerId);
          const d = path.primaryDeaths ?? 0;
          rec.fights++;
          rec.deaths += d;
          rec.pathFights++;
          rec.pathDeaths += d;
          rec.fightDetails.push({
            nodeLabel,
            nodeType: "path",
            nodeNumber: nodeNum,
            bgNumber: bgNum,
            deaths: d,
            wasBackup: false,
            wasNoShow: path.playerNoShow ?? false,
          });
          bgTotals[bgNum].fights++;
          bgTotals[bgNum].deaths += d;
          deathDist.path += d;
          deathDist.total += d;
        }

        // Backup player
        if (path.backupHelped && path.backupPlayerId) {
          const rec = getOrCreateWarRecord(path.backupPlayerId);
          const d = path.backupDeaths ?? 0;
          rec.fights++;
          rec.deaths += d;
          rec.pathFights++;
          rec.pathDeaths += d;
          rec.fightDetails.push({
            nodeLabel: `${nodeLabel} (backup)`,
            nodeType: "path",
            nodeNumber: nodeNum,
            bgNumber: bgNum,
            deaths: d,
            wasBackup: true,
            wasNoShow: false,
          });
          // Don't double-count bgTotals for backup
        }

        // Node heat map
        const existing = nodeAccum.get(nodeKey) ?? {
          nodeLabel,
          nodeType: "path" as const,
          nodeNumber: nodeNum,
          bgNumber: bgNum,
          fights: 0,
          deaths: 0,
          deathRate: 0,
        };
        if (path.assignedPlayerId) {
          existing.fights++;
          existing.deaths += path.primaryDeaths ?? 0;
        }
        nodeAccum.set(nodeKey, existing);
      }

      // ── Mini Bosses ────────────────────────────────────────────────────────
      for (let mbIdx = 0; mbIdx < (bg.miniBosses ?? []).length; mbIdx++) {
        const mb = bg.miniBosses![mbIdx];
        const nodeKey = `bg${bgNum}-mb${mb.nodeNumber}`;
        const nodeLabel = `BG${bgNum} ${mb.name || `Mini Boss ${mbIdx + 1}`}`;

        if (mb.assignedPlayerId) {
          const rec = getOrCreateWarRecord(mb.assignedPlayerId);
          const d = mb.primaryDeaths ?? 0;
          rec.fights++;
          rec.deaths += d;
          rec.miniBossFights++;
          rec.miniBossDeaths += d;
          rec.fightDetails.push({
            nodeLabel,
            nodeType: "mini-boss",
            nodeNumber: mb.nodeNumber,
            bgNumber: bgNum,
            deaths: d,
            wasBackup: false,
            wasNoShow: mb.playerNoShow ?? false,
          });
          bgTotals[bgNum].fights++;
          bgTotals[bgNum].deaths += d;
          deathDist.miniBoss += d;
          deathDist.total += d;
        }

        if (mb.backupHelped && mb.backupPlayerId) {
          const rec = getOrCreateWarRecord(mb.backupPlayerId);
          const d = mb.backupDeaths ?? 0;
          rec.fights++;
          rec.deaths += d;
          rec.miniBossFights++;
          rec.miniBossDeaths += d;
          rec.fightDetails.push({
            nodeLabel: `${nodeLabel} (backup)`,
            nodeType: "mini-boss",
            nodeNumber: mb.nodeNumber,
            bgNumber: bgNum,
            deaths: d,
            wasBackup: true,
            wasNoShow: false,
          });
        }

        const existing = nodeAccum.get(nodeKey) ?? {
          nodeLabel,
          nodeType: "mini-boss" as const,
          nodeNumber: mb.nodeNumber,
          bgNumber: bgNum,
          fights: 0,
          deaths: 0,
          deathRate: 0,
        };
        if (mb.assignedPlayerId) {
          existing.fights++;
          existing.deaths += mb.primaryDeaths ?? 0;
        }
        nodeAccum.set(nodeKey, existing);
      }

      // ── Boss ───────────────────────────────────────────────────────────────
      const boss = bg.boss;
      if (boss) {
        const nodeKey = `bg${bgNum}-boss`;
        const nodeLabel = `BG${bgNum} Boss`;

        if (boss.assignedPlayerId) {
          const rec = getOrCreateWarRecord(boss.assignedPlayerId);
          const d = boss.primaryDeaths ?? 0;
          rec.fights++;
          rec.deaths += d;
          rec.bossFights++;
          rec.bossDeaths += d;
          rec.fightDetails.push({
            nodeLabel,
            nodeType: "boss",
            nodeNumber: boss.nodeNumber ?? 50,
            bgNumber: bgNum,
            deaths: d,
            wasBackup: false,
            wasNoShow: boss.playerNoShow ?? false,
          });
          bgTotals[bgNum].fights++;
          bgTotals[bgNum].deaths += d;
          deathDist.boss += d;
          deathDist.total += d;
        }

        if (boss.backupHelped && boss.backupPlayerId) {
          const rec = getOrCreateWarRecord(boss.backupPlayerId);
          const d = boss.backupDeaths ?? 0;
          rec.fights++;
          rec.deaths += d;
          rec.bossFights++;
          rec.bossDeaths += d;
          rec.fightDetails.push({
            nodeLabel: `${nodeLabel} (backup)`,
            nodeType: "boss",
            nodeNumber: boss.nodeNumber ?? 50,
            bgNumber: bgNum,
            deaths: d,
            wasBackup: true,
            wasNoShow: false,
          });
        }

        const existing = nodeAccum.get(nodeKey) ?? {
          nodeLabel,
          nodeType: "boss" as const,
          nodeNumber: boss.nodeNumber ?? 50,
          bgNumber: bgNum,
          fights: 0,
          deaths: 0,
          deathRate: 0,
        };
        if (boss.assignedPlayerId) {
          existing.fights++;
          existing.deaths += boss.primaryDeaths ?? 0;
        }
        nodeAccum.set(nodeKey, existing);
      }

      // Merge war records into playerAccum
      for (const [playerId, warRec] of warPlayerMap.entries()) {
        // Finalise soloRate for this war record
        warRec.soloRate =
          warRec.fights > 0
            ? ((warRec.fights - warRec.deaths) / warRec.fights) * 100
            : 100;

        if (!playerAccum.has(playerId)) {
          const p = playerMap.get(playerId);
          playerAccum.set(playerId, {
            bgNumber: p?.bgAssignment ?? bgNum - 1,
            warHistory: [],
          });
        }
        playerAccum.get(playerId)!.warHistory.push(warRec);
      }
    }
  }

  // ── Build final playerStats ───────────────────────────────────────────────
  const playerStats: PlayerSeasonStats[] = [];

  for (const [playerId, accum] of playerAccum.entries()) {
    const player = playerMap.get(playerId);

    const totalFights = accum.warHistory.reduce((s, w) => s + w.fights, 0);
    const totalDeaths = accum.warHistory.reduce((s, w) => s + w.deaths, 0);
    const totalPathFights = accum.warHistory.reduce((s, w) => s + w.pathFights, 0);
    const totalPathDeaths = accum.warHistory.reduce((s, w) => s + w.pathDeaths, 0);
    const totalMiniBossFights = accum.warHistory.reduce((s, w) => s + w.miniBossFights, 0);
    const totalMiniBossDeaths = accum.warHistory.reduce((s, w) => s + w.miniBossDeaths, 0);
    const totalBossFights = accum.warHistory.reduce((s, w) => s + w.bossFights, 0);
    const totalBossDeaths = accum.warHistory.reduce((s, w) => s + w.bossDeaths, 0);

    playerStats.push({
      playerId,
      playerName: player?.name || "Unknown",
      bgNumber: accum.bgNumber,
      warHistory: accum.warHistory.sort((a, b) => a.warNumber - b.warNumber),
      totalFights,
      totalDeaths,
      totalPathFights,
      totalPathDeaths,
      totalMiniBossFights,
      totalMiniBossDeaths,
      totalBossFights,
      totalBossDeaths,
      overallSoloRate:
        totalFights > 0
          ? ((totalFights - totalDeaths) / totalFights) * 100
          : 100,
      warsParticipated: accum.warHistory.length,
    });
  }

  // Sort by deaths asc, then fights desc for tie-breaking (most efficient fighters at top)
  playerStats.sort((a, b) =>
    a.totalDeaths !== b.totalDeaths
      ? a.totalDeaths - b.totalDeaths
      : b.totalFights - a.totalFights
  );

  // ── Hardest nodes ─────────────────────────────────────────────────────────
  const hardestNodes = Array.from(nodeAccum.values())
    .map((n) => ({
      ...n,
      deathRate: n.fights > 0 ? (n.deaths / n.fights) * 100 : 0,
    }))
    .sort((a, b) => b.deaths - a.deaths || b.deathRate - a.deathRate)
    .slice(0, 10);

  // ── Global totals ─────────────────────────────────────────────────────────
  const globalFights =
    bgTotals[1].fights + bgTotals[2].fights + bgTotals[3].fights;
  const globalDeaths =
    bgTotals[1].deaths + bgTotals[2].deaths + bgTotals[3].deaths;

  return {
    totalWars: wars.length,
    wins,
    losses,
    draws,
    pending,
    winRate: wars.length > 0 ? (wins / wars.length) * 100 : 0,
    globalFights,
    globalDeaths,
    globalSoloRate:
      globalFights > 0
        ? ((globalFights - globalDeaths) / globalFights) * 100
        : 100,
    deathDistribution: deathDist,
    playerStats,
    hardestNodes,
    bgTotals: {
      1: {
        ...bgTotals[1],
        soloRate:
          bgTotals[1].fights > 0
            ? ((bgTotals[1].fights - bgTotals[1].deaths) /
                bgTotals[1].fights) *
              100
            : 100,
      },
      2: {
        ...bgTotals[2],
        soloRate:
          bgTotals[2].fights > 0
            ? ((bgTotals[2].fights - bgTotals[2].deaths) /
                bgTotals[2].fights) *
              100
            : 100,
      },
      3: {
        ...bgTotals[3],
        soloRate:
          bgTotals[3].fights > 0
            ? ((bgTotals[3].fights - bgTotals[3].deaths) /
                bgTotals[3].fights) *
              100
            : 100,
      },
    },
  };
}

// ─── Convenience selectors (use in components) ────────────────────────────────

/** Filter playerStats to a single BG (bgNumber is 1-indexed here) */
export function filterByBg(
  stats: SeasonAnalytics,
  bgNumber: 1 | 2 | 3
): PlayerSeasonStats[] {
  return stats.playerStats.filter((p) => p.bgNumber === bgNumber - 1);
}

/** Get a single player's full record */
export function getPlayerStats(
  stats: SeasonAnalytics,
  playerId: string
): PlayerSeasonStats | undefined {
  return stats.playerStats.find((p) => p.playerId === playerId);
}