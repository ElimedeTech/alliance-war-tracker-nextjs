"use client";

/**
 * SeasonStatsView.tsx
 *
 * Drop-in stats dashboard powered by seasonAnalytics.ts.
 *
 * USAGE — replace the contents of your <StatsModal> stats section, or
 * add a new "Season" tab to StatsModal:
 *
 *   import { SeasonStatsView } from "./SeasonStatsView";
 *   import { computeSeasonAnalytics } from "@/lib/seasonAnalytics";
 *
 *   // Inside StatsModal:
 *   const analytics = useMemo(
 *     () => computeSeasonAnalytics(wars, players),
 *     [wars, players]
 *   );
 *   <SeasonStatsView analytics={analytics} />
 */

import { useMemo, useState, useRef } from "react";
import {
  SeasonAnalytics,
  PlayerSeasonStats,
  PlayerWarRecord,
  DeathDistribution,
  NodeHeatEntry,
} from "@/lib/seasonAnalytics";
import { BattlegroupSummary } from "./BattlegroupSummary";
import { WarInsightsPanel } from "./WarInsightsPanel";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function soloColor(rate: number) {
  if (rate >= 95) return "text-emerald-400";
  if (rate >= 80) return "text-sky-400";
  if (rate >= 60) return "text-yellow-400";
  return "text-red-400";
}

function soloBarColor(rate: number) {
  if (rate >= 95) return "bg-emerald-500";
  if (rate >= 80) return "bg-sky-500";
  if (rate >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function nodeTypeBadge(type: "path" | "mini-boss" | "boss") {
  if (type === "boss")
    return "bg-red-900/60 text-red-300 border border-red-800/60";
  if (type === "mini-boss")
    return "bg-orange-900/60 text-orange-300 border border-orange-800/60";
  return "bg-slate-800 text-slate-400 border border-slate-700";
}

function resultBadge(result: PlayerWarRecord["result"]) {
  if (result === "win") return "bg-emerald-900/50 text-emerald-300";
  if (result === "loss") return "bg-red-900/50 text-red-300";
  if (result === "tie") return "bg-yellow-900/50 text-yellow-300";
  return "bg-slate-800 text-slate-400";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = "text-slate-200",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className={`text-2xl font-black font-mono tracking-tight ${accent}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-slate-600">{sub}</span>}
    </div>
  );
}

function DeathBar({ dist }: { dist: DeathDistribution }) {
  if (dist.total === 0) return null;
  const pathPct = (dist.path / dist.total) * 100;
  const mbPct = (dist.miniBoss / dist.total) * 100;
  const bossPct = (dist.boss / dist.total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div
          className="bg-slate-500 transition-all"
          style={{ width: `${pathPct}%` }}
          title={`Path: ${dist.path}`}
        />
        <div
          className="bg-orange-500 transition-all"
          style={{ width: `${mbPct}%` }}
          title={`Mini-Boss: ${dist.miniBoss}`}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${bossPct}%` }}
          title={`Boss: ${dist.boss}`}
        />
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
          Path {dist.path} ({pathPct.toFixed(0)}%)
        </span>
        <span className="flex items-center gap-1.5 text-orange-400">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
          Mini-Boss {dist.miniBoss} ({mbPct.toFixed(0)}%)
        </span>
        <span className="flex items-center gap-1.5 text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Boss {dist.boss} ({bossPct.toFixed(0)}%)
        </span>
      </div>
    </div>
  );
}

function PlayerRow({
  stat,
  rank,
  totalWars,
  onClick,
}: {
  stat: PlayerSeasonStats;
  rank: number;
  totalWars: number;
  onClick: () => void;
}) {
  const bgLabel = ["BG1", "BG2", "BG3"][stat.bgNumber] ?? "—";
  const participationPct =
    totalWars > 0 ? (stat.warsParticipated / totalWars) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors text-left group border-b border-slate-800/40 last:border-0"
    >
      {/* Rank */}
      <span className="text-xs font-mono text-slate-600 w-5 shrink-0 text-right">
        {rank}
      </span>

      {/* Name + BG */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200 truncate text-sm group-hover:text-white transition-colors">
            {stat.playerName}
          </span>
          <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
            {bgLabel}
          </span>
        </div>
        {/* Participation bar */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-600 rounded-full"
              style={{ width: `${participationPct}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-600 shrink-0">
            {stat.warsParticipated}/{totalWars} wars
          </span>
        </div>
      </div>

      {/* Fights */}
      <div className="text-right shrink-0 w-14">
        <span className="text-sm font-mono font-semibold text-slate-300">
          {stat.totalFights}
        </span>
        <span className="block text-[9px] text-slate-600">fights</span>
      </div>

      {/* Deaths */}
      <div className="text-right shrink-0 w-12">
        <span className="text-sm font-mono font-semibold text-red-400">
          {stat.totalDeaths}
        </span>
        <span className="block text-[9px] text-slate-600">deaths</span>
      </div>

      {/* Solo rate bar */}
      <div className="shrink-0 w-20 space-y-1">
        <div
          className={`text-xs font-mono font-black text-right ${soloColor(stat.overallSoloRate)}`}
        >
          {pct(stat.overallSoloRate)}
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${soloBarColor(stat.overallSoloRate)}`}
            style={{ width: `${stat.overallSoloRate}%` }}
          />
        </div>
      </div>
    </button>
  );
}

function PlayerDetail({
  stat,
  onBack,
}: {
  stat: PlayerSeasonStats;
  onBack: () => void;
}) {
  const bgLabel = ["BG1", "BG2", "BG3"][stat.bgNumber] ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
        >
          ← Back
        </button>
        <div>
          <h3 className="text-lg font-black text-white">{stat.playerName}</h3>
          <span className="text-xs text-slate-500 font-bold uppercase">
            {bgLabel} · {stat.warsParticipated} wars participated
          </span>
        </div>
      </div>

      {/* Aggregate stat cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <StatCard label="Fights" value={stat.totalFights} />
        <StatCard label="Deaths" value={stat.totalDeaths} accent="text-red-400" />
        <StatCard
          label="Solo Rate"
          value={pct(stat.overallSoloRate)}
          accent={soloColor(stat.overallSoloRate)}
        />
        <StatCard
          label="Path"
          value={stat.totalPathDeaths}
          sub={`${stat.totalPathFights} fights`}
          accent="text-slate-300"
        />
        <StatCard
          label="Mini-Boss"
          value={stat.totalMiniBossDeaths}
          sub={`${stat.totalMiniBossFights} fights`}
          accent="text-orange-400"
        />
        <StatCard
          label="Boss"
          value={stat.totalBossDeaths}
          sub={`${stat.totalBossFights} fights`}
          accent="text-red-400"
        />
      </div>

      {/* War-by-war history */}
      <div className="space-y-2">
        <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest px-1">
          War History
        </h4>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60">
          {stat.warHistory.length === 0 && (
            <p className="text-slate-600 text-sm text-center py-8">
              No war history recorded.
            </p>
          )}
          {stat.warHistory.map((w) => (
            <div
              key={w.warId}
              className="flex items-center gap-3 px-4 py-3 text-sm"
            >
              <span className="font-mono text-slate-500 text-xs w-12 shrink-0">
                #{w.warNumber}
              </span>
              <span className="font-medium text-slate-300 flex-1 truncate">
                {w.warName}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${resultBadge(w.result)}`}
              >
                {w.result}
              </span>
              <span className="text-slate-400 font-mono w-16 text-right">
                {w.fights}f / {w.deaths}d
              </span>
              <span
                className={`font-mono font-bold text-xs w-14 text-right ${soloColor(w.soloRate)}`}
              >
                {pct(w.soloRate)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SeasonStatsViewProps {
  analytics: SeasonAnalytics;
  /** Optional custom BG colour hex strings */
  bgColors?: { 1: string; 2: string; 3: string };
}

export function SeasonStatsView({ analytics, bgColors }: SeasonStatsViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "players" | "nodes">(
    "overview"
  );
  const [bgFilter, setBgFilter] = useState<0 | 1 | 2 | 3>(0); // 0 = all
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSeasonStats | null>(null);
  const [focusedNodeLabel, setFocusedNodeLabel] = useState<string | null>(null);
  const nodesTabRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = (node: NodeHeatEntry) => {
    setFocusedNodeLabel(node.nodeLabel);
    setActiveTab("nodes");
    setTimeout(() => {
      nodesTabRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handlePlayerClick = (player: PlayerSeasonStats) => {
    setSelectedPlayer(player);
    setActiveTab("players");
    setTimeout(() => {
      nodesTabRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const visiblePlayers = useMemo(() => {
    if (bgFilter === 0) return analytics.playerStats;
    // bgNumber in playerStats is 0-indexed; bgFilter is 1-indexed
    return analytics.playerStats.filter((p) => p.bgNumber === bgFilter - 1);
  }, [analytics.playerStats, bgFilter]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "players", label: `Players (${analytics.playerStats.length})` },
    { id: "nodes", label: "Hardest Nodes" },
  ] as const;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setSelectedPlayer(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.id
                ? "bg-slate-700 text-white shadow"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ───────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* BG Summary at top of overview too */}
          <BattlegroupSummary
            analytics={analytics}
            selectedBg={null}
            onSelectBg={(bg) => {
              if (bg) {
                setBgFilter(bg);
                setActiveTab("players");
              }
            }}
            bgColors={bgColors}
          />

          {/* War Insights — clickable cards linking to nodes + player detail */}
          <div className="pt-2">
            <WarInsightsPanel
              analytics={analytics}
              onNodeClick={handleNodeClick}
              onPlayerClick={handlePlayerClick}
            />
          </div>

          {/* Global KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Wars"
              value={analytics.totalWars}
              sub={`${analytics.wins}W / ${analytics.losses}L`}
            />
            <StatCard
              label="Win Rate"
              value={pct(analytics.winRate)}
              accent={
                analytics.winRate >= 60
                  ? "text-emerald-400"
                  : analytics.winRate >= 40
                  ? "text-yellow-400"
                  : "text-red-400"
              }
            />
            <StatCard
              label="Global Efficiency"
              value={pct(analytics.globalSoloRate)}
              accent={soloColor(analytics.globalSoloRate)}
              sub={`${analytics.globalDeaths} deaths`}
            />
            <StatCard
              label="Total Fights"
              value={analytics.globalFights.toLocaleString()}
            />
          </div>

          {/* Per-BG breakdown — already shown in BattlegroupSummary above */}
        </div>
      )}

      {/* ── Players Tab ────────────────────────────────────────────────────── */}
      {activeTab === "players" && (
        <div className="space-y-4">
          {selectedPlayer ? (
            <PlayerDetail
              stat={selectedPlayer}
              onBack={() => setSelectedPlayer(null)}
            />
          ) : (
            <>
              {/* BG Summary — clickable filter cards */}
              <BattlegroupSummary
                analytics={analytics}
                selectedBg={bgFilter === 0 ? null : bgFilter as 1 | 2 | 3}
                onSelectBg={(bg) => setBgFilter(bg ?? 0)}
                bgColors={bgColors}
              />

              {/* Sort hint */}
              <div className="flex justify-end">
                <span className="text-xs text-slate-600 self-center">
                  Sorted: fewest deaths
                </span>
              </div>

              {/* Table header */}
              <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-slate-800">
                <span className="w-5 shrink-0" />
                <span className="flex-1">Player</span>
                <span className="w-14 text-right">Fights</span>
                <span className="w-12 text-right">Deaths</span>
                <span className="w-20 text-right">Solo Rate</span>
              </div>

              {/* Player rows */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                {visiblePlayers.length === 0 && (
                  <p className="text-slate-600 text-sm text-center py-10">
                    No players found.
                  </p>
                )}
                {visiblePlayers.map((stat, i) => (
                  <PlayerRow
                    key={stat.playerId}
                    stat={stat}
                    rank={i + 1}
                    totalWars={analytics.totalWars}
                    onClick={() => setSelectedPlayer(stat)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Hardest Nodes Tab ──────────────────────────────────────────────── */}
      {activeTab === "nodes" && (
        <div className="space-y-3" ref={nodesTabRef}>
          <p className="text-xs text-slate-500">
            Top 10 nodes by total deaths across all wars.
            {focusedNodeLabel && (
              <span className="ml-2 text-amber-400 font-bold">
                Highlighting: {focusedNodeLabel}
              </span>
            )}
          </p>
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/40">
            {analytics.hardestNodes.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-10">
                No node data yet.
              </p>
            )}
            {analytics.hardestNodes.map((node, i) => (
              <div
                key={`${node.nodeLabel}-${i}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors duration-300"
                style={{
                  backgroundColor:
                    node.nodeLabel === focusedNodeLabel
                      ? "rgba(245,158,11,0.08)"
                      : undefined,
                  borderLeft:
                    node.nodeLabel === focusedNodeLabel
                      ? "2px solid #f59e0b"
                      : "2px solid transparent",
                }}
              >
                <span className="text-xs font-mono text-slate-600 w-4 shrink-0">
                  {i + 1}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${nodeTypeBadge(node.nodeType)}`}
                >
                  {node.nodeType === "mini-boss"
                    ? "MB"
                    : node.nodeType === "boss"
                    ? "BOSS"
                    : "PATH"}
                </span>
                <span className="flex-1 text-sm text-slate-300 font-medium">
                  {node.nodeLabel}
                </span>
                <span className="text-xs text-slate-500 shrink-0">
                  {node.fights} fights
                </span>
                <span className="text-sm font-mono font-bold text-red-400 w-12 text-right shrink-0">
                  {node.deaths}💀
                </span>
                <div className="w-16 shrink-0 space-y-0.5">
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${Math.min(node.deathRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600 block text-right">
                    {pct(node.deathRate)} rate
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}