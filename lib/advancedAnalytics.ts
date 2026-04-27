/**
 * advancedAnalytics.ts
 *
 * Extended analytics layer built on top of SeasonAnalytics.
 * Computes: consistency scores, node affinity, win/loss correlation,
 * BG balance, season-over-season trends, and death type breakdowns.
 *
 * Usage:
 *   const analytics = computeSeasonAnalytics(wars, players);
 *   const advanced  = computeAdvancedAnalytics(analytics, wars, seasons);
 */

import { War } from "@/types";
import { SeasonAnalytics, PlayerSeasonStats } from "@/lib/seasonAnalytics";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConsistencyGrade = "Elite" | "Consistent" | "Variable" | "Erratic";
export type Trend = "improving" | "declining" | "stable";

export interface ConsistencyMetrics {
  stdDev: number;
  grade: ConsistencyGrade;
  trend: Trend;
  recentAvg: number;   // last 3 wars average solo rate
  allTimeAvg: number;
}

export interface NodeAffinityEntry {
  nodeLabel: string;
  nodeType: "path" | "mini-boss" | "boss";
  bgNumber: number;
  fights: number;
  deaths: number;
  deathRate: number;  // 0–100
}

export interface PlayerAdvanced {
  playerId: string;
  playerName: string;
  bgNumber: number;
  consistency: ConsistencyMetrics;
  nodeAffinity: NodeAffinityEntry[];     // sorted worst first
  bestNodes: NodeAffinityEntry[];        // 0 deaths, min 2 fights
  worstNodes: NodeAffinityEntry[];       // top 3 by death rate, min 2 fights
}

export interface BgBalanceData {
  bgNumber: 1 | 2 | 3;
  playerCount: number;
  avgBayesianRate: number;
  grade: string;
  topPlayer: string;
  bottomPlayer: string;
}

export interface WinCorrelation {
  winAvgSoloRate: number;
  lossAvgSoloRate: number;
  winSampleSize: number;
  lossSampleSize: number;
  bgCorrelations: Record<number, { winAvg: number; lossAvg: number; diff: number }>;
  /** Which BG most differentiates wins from losses */
  criticalBg: 1 | 2 | 3 | null;
  insight: string;
}

export interface SeasonTrend {
  seasonId: string;
  seasonName: string;
  wars: number;
  wins: number;
  losses: number;
  winRate: number;
  avgSoloRate: number;
  totalDeaths: number;
}

export interface AdvancedAnalytics {
  playerAdvanced: PlayerAdvanced[];
  winCorrelation: WinCorrelation;
  bgBalance: BgBalanceData[];
  seasonTrends: SeasonTrend[];
  /** Whether the alliance is improving, declining or stable vs prior 3 wars */
  allianceTrend: Trend;
  /** Alliance-wide avg consistency stdDev */
  avgConsistencyStdDev: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = avg(arr);
  const variance = arr.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function consistencyGrade(sd: number): ConsistencyGrade {
  if (sd < 5)  return "Elite";
  if (sd < 15) return "Consistent";
  if (sd < 25) return "Variable";
  return "Erratic";
}

function computePlayerConsistency(player: PlayerSeasonStats): ConsistencyMetrics {
  const rates = player.warHistory.map(w => w.soloRate);

  if (rates.length === 0) {
    return { stdDev: 0, grade: "Elite", trend: "stable", recentAvg: 100, allTimeAvg: 100 };
  }

  // With only 1 war there's no meaningful stdDev — grade based on that war's solo rate instead.
  if (rates.length === 1) {
    const rate = rates[0];
    const grade: ConsistencyGrade =
      rate >= 95 ? "Elite" :
      rate >= 80 ? "Consistent" :
      rate >= 60 ? "Variable" : "Erratic";
    return {
      stdDev: 0,
      grade,
      trend: "stable",
      recentAvg: Math.round(rate * 10) / 10,
      allTimeAvg: Math.round(rate * 10) / 10,
    };
  }

  const mean = avg(rates);
  const sd   = stdDev(rates);

  const recent = rates.slice(-3);
  const prior  = rates.slice(-6, -3);
  const recentAvg = avg(recent);
  const priorAvg  = prior.length > 0 ? avg(prior) : mean;

  const trend: Trend =
    recentAvg > priorAvg + 3  ? "improving" :
    recentAvg < priorAvg - 3  ? "declining" :
    "stable";

  return {
    stdDev:     Math.round(sd * 10) / 10,
    grade:      consistencyGrade(sd),
    trend,
    recentAvg:  Math.round(recentAvg * 10) / 10,
    allTimeAvg: Math.round(mean * 10) / 10,
  };
}

function computeNodeAffinity(player: PlayerSeasonStats): NodeAffinityEntry[] {
  const nodeMap = new Map<string, NodeAffinityEntry>();

  for (const war of player.warHistory) {
    for (const fight of war.fightDetails) {
      const existing = nodeMap.get(fight.nodeLabel) ?? {
        nodeLabel:  fight.nodeLabel,
        nodeType:   fight.nodeType,
        bgNumber:   fight.bgNumber,
        fights:     0,
        deaths:     0,
        deathRate:  0,
      };
      existing.fights++;
      existing.deaths += fight.deaths;
      nodeMap.set(fight.nodeLabel, existing);
    }
  }

  return Array.from(nodeMap.values())
    .map(n => ({ ...n, deathRate: n.fights > 0 ? (n.deaths / n.fights) * 100 : 0 }))
    .sort((a, b) => b.deaths - a.deaths || b.deathRate - a.deathRate);
}

// ─── Main Computation ─────────────────────────────────────────────────────────

export function computeAdvancedAnalytics(
  analytics:  SeasonAnalytics,
  wars:       War[],
  seasons?:   Array<{ id: string; name: string }>,
): AdvancedAnalytics {

  // ── 1. Per-player: consistency + node affinity ──────────────────────────────
  const playerAdvanced: PlayerAdvanced[] = analytics.playerStats.map(p => {
    const consistency  = computePlayerConsistency(p);
    const nodeAffinity = computeNodeAffinity(p);

    const bestNodes = nodeAffinity
      .filter(n => n.deaths === 0 && n.fights >= 2)
      .slice(0, 3);

    const worstNodes = nodeAffinity
      .filter(n => n.fights >= 2)
      .sort((a, b) => b.deathRate - a.deathRate)
      .slice(0, 3);

    return {
      playerId:     p.playerId,
      playerName:   p.playerName,
      bgNumber:     p.bgNumber,
      consistency,
      nodeAffinity,
      bestNodes,
      worstNodes,
    };
  });

  // ── 2. Win / Loss correlation ───────────────────────────────────────────────
  // Build per-war BG fight/death totals from player war histories
  const warBgPerf = new Map<string, {
    result: string;
    bgFights:  Record<number, number>;
    bgDeaths:  Record<number, number>;
  }>();

  for (const p of analytics.playerStats) {
    const bgNum = p.bgNumber + 1; // 0-indexed → 1-indexed
    for (const wRec of p.warHistory) {
      if (!warBgPerf.has(wRec.warId)) {
        warBgPerf.set(wRec.warId, {
          result:   wRec.result,
          bgFights: { 1: 0, 2: 0, 3: 0 },
          bgDeaths: { 1: 0, 2: 0, 3: 0 },
        });
      }
      const perf = warBgPerf.get(wRec.warId)!;
      perf.bgFights[bgNum] = (perf.bgFights[bgNum] ?? 0) + wRec.fights;
      perf.bgDeaths[bgNum] = (perf.bgDeaths[bgNum] ?? 0) + wRec.deaths;
    }
  }

  const winGlobal: number[] = [];
  const lossGlobal: number[] = [];
  const bgWinRates:  Record<number, number[]> = { 1: [], 2: [], 3: [] };
  const bgLossRates: Record<number, number[]> = { 1: [], 2: [], 3: [] };

  for (const [, perf] of warBgPerf.entries()) {
    const allF = Object.values(perf.bgFights).reduce((s, f) => s + f, 0);
    const allD = Object.values(perf.bgDeaths).reduce((s, d) => s + d, 0);
    const globalRate = allF > 0 ? ((allF - allD) / allF) * 100 : 100;

    for (const bg of [1, 2, 3] as const) {
      const f = perf.bgFights[bg] ?? 0;
      const d = perf.bgDeaths[bg] ?? 0;
      if (f > 0) {
        const rate = ((f - d) / f) * 100;
        if (perf.result === "win")  bgWinRates[bg].push(rate);
        if (perf.result === "loss") bgLossRates[bg].push(rate);
      }
    }

    if (perf.result === "win")  winGlobal.push(globalRate);
    if (perf.result === "loss") lossGlobal.push(globalRate);
  }

  const bgCorrelations: Record<number, { winAvg: number; lossAvg: number; diff: number }> = {};
  let maxDiff = -1;
  let criticalBg: 1 | 2 | 3 | null = null;

  for (const bg of [1, 2, 3] as const) {
    const wAvg = avg(bgWinRates[bg]);
    const lAvg = avg(bgLossRates[bg]);
    const diff = Math.abs(wAvg - lAvg);
    bgCorrelations[bg] = { winAvg: Math.round(wAvg * 10) / 10, lossAvg: Math.round(lAvg * 10) / 10, diff: Math.round(diff * 10) / 10 };
    if (diff > maxDiff) { maxDiff = diff; criticalBg = bg; }
  }

  const winAvg  = avg(winGlobal);
  const lossAvg = avg(lossGlobal);
  const gap     = winAvg - lossAvg;

  const insight =
    winGlobal.length === 0 || lossGlobal.length === 0
      ? "Not enough win/loss data yet."
      : gap > 10
      ? `You win convincingly when solo rate exceeds ${Math.round(winAvg)}%. ${criticalBg ? `BG${criticalBg} is your most decisive battleground.` : ""}`
      : gap > 4
      ? `A ${Math.round(gap)}% efficiency gap separates your wins from losses. ${criticalBg ? `Focus on BG${criticalBg}.` : ""}`
      : "Wins and losses are closely contested — map difficulty may be the bigger factor.";

  const winCorrelation: WinCorrelation = {
    winAvgSoloRate:  Math.round(winAvg  * 10) / 10,
    lossAvgSoloRate: Math.round(lossAvg * 10) / 10,
    winSampleSize:   winGlobal.length,
    lossSampleSize:  lossGlobal.length,
    bgCorrelations,
    criticalBg,
    insight,
  };

  // ── 3. BG Balance ───────────────────────────────────────────────────────────
  const bgGroups: Record<number, PlayerSeasonStats[]> = { 1: [], 2: [], 3: [] };
  for (const p of analytics.playerStats) {
    const bg = p.bgNumber + 1;
    if (bg >= 1 && bg <= 3) bgGroups[bg].push(p);
  }

  const bgBalance: BgBalanceData[] = ([1, 2, 3] as const).map(bg => {
    const group = bgGroups[bg];
    const avgRate = group.length > 0
      ? group.reduce((s, p) => s + p.bayesianSoloRate, 0) / group.length
      : 0;

    const sorted = [...group].sort((a, b) => b.bayesianSoloRate - a.bayesianSoloRate);

    return {
      bgNumber:     bg,
      playerCount:  group.length,
      avgBayesianRate: Math.round(avgRate * 10) / 10,
      grade:
        avgRate >= 90 ? "Elite" :
        avgRate >= 80 ? "Strong" :
        avgRate >= 70 ? "Average" :
        "Struggling",
      topPlayer:    sorted[0]?.playerName ?? "—",
      bottomPlayer: sorted[sorted.length - 1]?.playerName ?? "—",
    };
  });

  // ── 4. Season Trends ────────────────────────────────────────────────────────
  const seasonGroups = new Map<string, War[]>();
  for (const war of wars) {
    const sid = war.seasonId;
    // Skip wars that haven't been assigned to a season — they would create a
    // spurious "untracked" entry in the trends chart.
    if (!sid) continue;
    if (!seasonGroups.has(sid)) seasonGroups.set(sid, []);
    seasonGroups.get(sid)!.push(war);
  }

  const seasonTrends: SeasonTrend[] = Array.from(seasonGroups.entries()).map(
    ([seasonId, sWars]) => {
      const winsCount  = sWars.filter(w => w.allianceResult === "win").length;
      const lossesCount = sWars.filter(w => w.allianceResult === "loss").length;

      // Compute solo rate for this season's wars from player war histories
      const warIds = new Set(sWars.map(w => w.id));
      let totalF = 0, totalD = 0;
      for (const p of analytics.playerStats) {
        for (const wRec of p.warHistory) {
          if (warIds.has(wRec.warId)) {
            totalF += wRec.fights;
            totalD += wRec.deaths;
          }
        }
      }

      const seasonName = seasons?.find(s => s.id === seasonId)?.name ?? seasonId;

      return {
        seasonId,
        seasonName,
        wars:     sWars.length,
        wins:     winsCount,
        losses:   lossesCount,
        winRate:  sWars.length > 0 ? Math.round((winsCount / sWars.length) * 1000) / 10 : 0,
        avgSoloRate: totalF > 0 ? Math.round(((totalF - totalD) / totalF) * 1000) / 10 : 100,
        totalDeaths: totalD,
      };
    }
  );

  // ── 5. Alliance-level trend ─────────────────────────────────────────────────
  const allWarRates: number[] = [];
  for (const [, perf] of warBgPerf.entries()) {
    const allF = Object.values(perf.bgFights).reduce((s, f) => s + f, 0);
    const allD = Object.values(perf.bgDeaths).reduce((s, d) => s + d, 0);
    if (allF > 0) allWarRates.push(((allF - allD) / allF) * 100);
  }

  const recentWarRates = allWarRates.slice(-3);
  const priorWarRates  = allWarRates.slice(-6, -3);
  const recentGlobal   = avg(recentWarRates);
  const priorGlobal    = avg(priorWarRates.length > 0 ? priorWarRates : allWarRates);

  const allianceTrend: Trend =
    recentGlobal > priorGlobal + 2  ? "improving" :
    recentGlobal < priorGlobal - 2  ? "declining" :
    "stable";

  // ── 6. Avg consistency stdDev across alliance ───────────────────────────────
  const allStdDevs = playerAdvanced.map(p => p.consistency.stdDev);
  const avgConsistencyStdDev = Math.round(avg(allStdDevs) * 10) / 10;

  return {
    playerAdvanced,
    winCorrelation,
    bgBalance,
    seasonTrends,
    allianceTrend,
    avgConsistencyStdDev,
  };
}

// ─── CSV Export Utilities ─────────────────────────────────────────────────────

export function exportPlayerStatsCSV(
  analytics: SeasonAnalytics,
  advanced:  AdvancedAnalytics,
  filename = "alliance-player-stats.csv"
): void {
  const headers = [
    "Player", "BG", "Wars", "Fights", "Deaths",
    "Solo%", "Adj.Solo%", "Consistency", "Trend", "RecentAvg%",
    "PathFights", "PathDeaths", "MBFights", "MBDeaths", "BossFights", "BossDeaths",
  ];

  const rows = analytics.playerStats.map(p => {
    const adv = advanced.playerAdvanced.find(a => a.playerId === p.playerId);
    return [
      `"${p.playerName}"`,
      `BG${p.bgNumber + 1}`,
      p.warsParticipated,
      p.totalFights,
      p.totalDeaths,
      p.overallSoloRate.toFixed(1),
      p.bayesianSoloRate.toFixed(1),
      adv?.consistency.grade  ?? "-",
      adv?.consistency.trend  ?? "-",
      adv?.consistency.recentAvg.toFixed(1) ?? "-",
      p.totalPathFights,
      p.totalPathDeaths,
      p.totalMiniBossFights,
      p.totalMiniBossDeaths,
      p.totalBossFights,
      p.totalBossDeaths,
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  triggerDownload(csv, filename, "text/csv");
}

export function exportWarStatsCSV(
  analytics: SeasonAnalytics,
  wars:      War[],
  filename = "alliance-war-stats.csv"
): void {
  const headers = [
    "War", "Date", "Result", "Opponent",
    "GlobalSolo%", "TotalFights", "TotalDeaths",
    "BG1Solo%", "BG2Solo%", "BG3Solo%",
  ];

  // Build per-war BG data from player histories
  const warBgMap = new Map<string, Record<number, { f: number; d: number }>>();
  for (const p of analytics.playerStats) {
    const bg = p.bgNumber + 1;
    for (const wRec of p.warHistory) {
      if (!warBgMap.has(wRec.warId)) warBgMap.set(wRec.warId, { 1: { f: 0, d: 0 }, 2: { f: 0, d: 0 }, 3: { f: 0, d: 0 } });
      const entry = warBgMap.get(wRec.warId)![bg] ?? { f: 0, d: 0 };
      entry.f += wRec.fights;
      entry.d += wRec.deaths;
      warBgMap.get(wRec.warId)![bg] = entry;
    }
  }

  const rows = wars.map(war => {
    const bgData = warBgMap.get(war.id) ?? { 1: { f: 0, d: 0 }, 2: { f: 0, d: 0 }, 3: { f: 0, d: 0 } };
    const allF = Object.values(bgData).reduce((s, b) => s + b.f, 0);
    const allD = Object.values(bgData).reduce((s, b) => s + b.d, 0);
    const bgRate = (bg: number) => {
      const b = bgData[bg];
      return b.f > 0 ? ((b.f - b.d) / b.f * 100).toFixed(1) : "-";
    };
    return [
      `"${war.name}"`,
      war.startDate ?? "-",
      war.allianceResult ?? "pending",
      `"${war.opponentName ?? "-"}"`,
      allF > 0 ? ((allF - allD) / allF * 100).toFixed(1) : "-",
      allF,
      allD,
      bgRate(1),
      bgRate(2),
      bgRate(3),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  triggerDownload(csv, filename, "text/csv");
}

function triggerDownload(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}