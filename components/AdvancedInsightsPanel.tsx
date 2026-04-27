"use client";

/**
 * AdvancedInsightsPanel.tsx
 *
 * Comprehensive advanced analytics panel covering:
 *  - Feature 2: Player-Node Affinity
 *  - Feature 3: Win/Loss Correlation
 *  - Feature 4: Player Consistency Score
 *  - Feature 7: BG Balance Score
 *  - Feature 8: Season-over-Season Trends
 *  - Feature 9: Death Type Breakdown
 *  - Feature 13: Export to CSV
 *
 * Usage in StatsModal:
 *   import { AdvancedInsightsPanel } from "./AdvancedInsightsPanel";
 *   import { computeAdvancedAnalytics } from "@/lib/advancedAnalytics";
 *
 *   const advanced = useMemo(() =>
 *   const analytics = useMemo(
 *     () => computeSeasonAnalytics(wars, players, pathAssignmentMode),
 *     [wars, players, pathAssignmentMode]
 *   );
 *   const advanced  = useMemo(
 *     () => computeAdvancedAnalytics(analytics, wars, seasons),
 *     [analytics, wars, seasons]
 *   );
 *   <AdvancedInsightsPanel analytics={analytics} advanced={advanced} wars={wars} />
 */

import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Minus,
  Download, Target, BarChart2,
  Users, GitBranch, Layers, ChevronDown, ChevronUp,
} from "lucide-react";
import { SeasonAnalytics, PlayerSeasonStats } from "@/lib/seasonAnalytics";
import {
  AdvancedAnalytics,
  PlayerAdvanced,
  ConsistencyGrade,
  Trend,
  exportPlayerStatsCSV,
  exportWarStatsCSV,
} from "@/lib/advancedAnalytics";
import { War } from "@/types";

// ─── Colour helpers ───────────────────────────────────────────────────────────

const soloColor = (r: number) =>
  r >= 95 ? "#34d399" : r >= 80 ? "#93c5fd" : r >= 60 ? "#fbbf24" : "#f87171";

const consistencyColor: Record<ConsistencyGrade, string> = {
  Elite:      "#34d399",
  Consistent: "#93c5fd",
  Variable:   "#fbbf24",
  Erratic:    "#f87171",
};

const trendIcon = (t: Trend, size = 14) => {
  if (t === "improving") return <TrendingUp  style={{ width: size, height: size, color: "#34d399" }} />;
  if (t === "declining") return <TrendingDown style={{ width: size, height: size, color: "#f87171" }} />;
  return <Minus style={{ width: size, height: size, color: "#64748b" }} />;
};

const deathRateColor = (r: number) =>
  r === 0 ? "#34d399" : r < 30 ? "#93c5fd" : r < 60 ? "#fbbf24" : "#f87171";

// ─── Tiny shared components ───────────────────────────────────────────────────

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
    >
      {label}
    </span>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${w}%`, backgroundColor: color }} />
    </div>
  );
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white">{title}</h3>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Tab: Consistency ────────────────────────────────────────────────────────

function ConsistencyTab({
  analytics,
  advanced,
}: {
  analytics: SeasonAnalytics;
  advanced: AdvancedAnalytics;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() =>
    analytics.playerStats.map(p => ({
      stats: p,
      adv:   advanced.playerAdvanced.find(a => a.playerId === p.playerId)!,
    })).filter(r => r.adv)
    .sort((a, b) => a.adv.consistency.stdDev - b.adv.consistency.stdDev),
    [analytics.playerStats, advanced.playerAdvanced],
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<BarChart2 className="w-3.5 h-3.5 text-sky-400" />}
        title="Player Consistency"
        sub="How reliably each player performs across wars — lower std dev = more predictable"
      />

      {/* Alliance summary — all 4 grades */}
      <div className="grid grid-cols-4 gap-3 mb-2">
        {(["Elite", "Consistent", "Variable", "Erratic"] as ConsistencyGrade[]).map(g => {
          const count = rows.filter(r => r.adv.consistency.grade === g).length;
          return (
            <div key={g} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-black" style={{ color: consistencyColor[g] }}>{count}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{g}</div>
            </div>
          );
        })}
      </div>

      {/* Player rows */}
      <div className="space-y-1.5">
        {rows.map(({ stats: p, adv }) => {
          const isOpen = expanded === p.playerId;
          const c = adv.consistency;
          return (
            <div key={p.playerId} className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : p.playerId)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors text-left"
              >
                {/* Name + BG */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200 truncate">{p.playerName}</span>
                    <span className="text-[9px] text-slate-600 font-bold">BG{p.bgNumber + 1}</span>
                  </div>
                </div>

                {/* Grade pill */}
                <Pill label={c.grade} color={consistencyColor[c.grade]} />

                {/* Trend icon */}
                <div className="flex items-center gap-1">
                  {trendIcon(c.trend)}
                </div>

                {/* Std Dev */}
                <div className="text-right w-16 shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-300">±{c.stdDev}%</span>
                  <div className="text-[9px] text-slate-600">std dev</div>
                </div>

                {/* Recent avg — absolute solo rate for last 3 wars */}
                <div className="text-right w-14 shrink-0">
                  <span className="text-xs font-mono font-bold" style={{ color: soloColor(c.recentAvg) }}>
                    {Math.max(0, c.recentAvg).toFixed(0)}%
                  </span>
                  <div className="text-[9px] text-slate-600">recent solo%</div>
                </div>

                {isOpen ? <ChevronUp className="w-3 h-3 text-slate-600 shrink-0" /> : <ChevronDown className="w-3 h-3 text-slate-600 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-800/60 pt-3 space-y-3">
                  {/* Death type breakdown — Feature 9 */}
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Death Type Breakdown</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Path",      fights: p.totalPathFights,     deaths: p.totalPathDeaths,     color: "#94a3b8" },
                        { label: "Mini Boss", fights: p.totalMiniBossFights,  deaths: p.totalMiniBossDeaths, color: "#fb923c" },
                        { label: "Boss",      fights: p.totalBossFights,      deaths: p.totalBossDeaths,     color: "#f87171" },
                      ].map(({ label, fights, deaths, color }) => {
                        const rate = fights > 0 ? (deaths / fights) * 100 : 0;
                        return (
                          <div key={label} className="bg-slate-800/60 rounded-lg p-2.5">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
                            <div className="text-sm font-black font-mono" style={{ color: deaths === 0 ? "#34d399" : color }}>
                              {deaths}💀
                            </div>
                            <div className="text-[9px] text-slate-600">{fights}f · {rate.toFixed(0)}% rate</div>
                            <MiniBar value={deaths} max={Math.max(p.totalPathDeaths, p.totalMiniBossDeaths, p.totalBossDeaths, 1)} color={color} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* War-by-war sparkline */}
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">War-by-War Solo Rate</div>
                    <div className="flex items-end gap-1 h-10">
                      {p.warHistory.map((w, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div
                            className="w-full rounded-sm transition-all"
                            style={{
                              height:          `${Math.max(4, w.soloRate * 0.4)}px`,
                              backgroundColor: soloColor(w.soloRate),
                              opacity:         0.8,
                            }}
                            title={`War ${w.warNumber}: ${w.soloRate.toFixed(0)}%`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                      <span>W1</span>
                      <span>W{p.warHistory.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Node Affinity ───────────────────────────────────────────────────────

function NodeAffinityTab({
  analytics,
  advanced,
}: {
  analytics: SeasonAnalytics;
  advanced:  AdvancedAnalytics;
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [view, setView] = useState<"worst" | "best">("worst");

  const selectedPlayer = useMemo(() =>
    advanced.playerAdvanced.find(p => p.playerId === selectedPlayerId),
    [advanced.playerAdvanced, selectedPlayerId],
  );

  const playerList = useMemo(() =>
    [...advanced.playerAdvanced].sort((a, b) => {
      const ap = analytics.playerStats.find(p => p.playerId === a.playerId);
      const bp = analytics.playerStats.find(p => p.playerId === b.playerId);
      return (ap?.bgNumber ?? 0) - (bp?.bgNumber ?? 0) || a.playerName.localeCompare(b.playerName);
    }),
    [advanced.playerAdvanced, analytics.playerStats],
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Target className="w-3.5 h-3.5 text-amber-400" />}
        title="Node Affinity"
        sub="Which specific nodes each player excels on or struggles with"
      />

      {/* Player selector */}
      <div className="flex flex-wrap gap-1.5">
        {playerList.map(p => (
          <button
            key={p.playerId}
            onClick={() => setSelectedPlayerId(p.playerId === selectedPlayerId ? null : p.playerId)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              backgroundColor: p.playerId === selectedPlayerId ? "#7c3aed" : "rgba(30,41,59,0.8)",
              color:           p.playerId === selectedPlayerId ? "#fff"   : "#94a3b8",
              border:          `1px solid ${p.playerId === selectedPlayerId ? "#7c3aed" : "rgba(71,85,105,0.4)"}`,
            }}
          >
            {p.playerName}
          </button>
        ))}
      </div>

      {selectedPlayer ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white">{selectedPlayer.playerName}</span>
            <div className="flex gap-1">
              {(["worst", "best"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                  style={{
                    backgroundColor: view === v ? (v === "worst" ? "#7f1d1d" : "#14532d") : "rgba(30,41,59,0.8)",
                    color:           view === v ? (v === "worst" ? "#fca5a5" : "#86efac")  : "#64748b",
                    border:          `1px solid ${view === v ? (v === "worst" ? "#991b1b" : "#166534") : "rgba(71,85,105,0.3)"}`,
                  }}
                >
                  {v === "worst" ? "⚠ Struggles" : "✓ Strengths"}
                </button>
              ))}
            </div>
          </div>

          {view === "worst" ? (
            <NodeList nodes={selectedPlayer.nodeAffinity.filter(n => n.fights >= 2 && n.deaths > 0).slice(0, 8)} emptyMsg="No deaths on any node with 2+ fights 🎉" />
          ) : (
            <NodeList nodes={selectedPlayer.bestNodes} emptyMsg="No nodes with 0 deaths and 2+ fights yet." />
          )}
        </div>
      ) : (
        <div className="text-slate-600 text-sm text-center py-8 border border-slate-800 rounded-xl">
          Select a player above to see their node affinity
        </div>
      )}
    </div>
  );
}

function NodeList({ nodes, emptyMsg }: { nodes: { nodeLabel: string; nodeType: string; fights: number; deaths: number; deathRate: number }[]; emptyMsg: string }) {
  if (nodes.length === 0) {
    return <p className="text-slate-600 text-sm text-center py-6">{emptyMsg}</p>;
  }
  const maxDeaths = Math.max(...nodes.map(n => n.deaths), 1);
  return (
    <div className="space-y-2">
      {nodes.map((n, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
              {n.nodeType === "mini-boss" ? "MB" : n.nodeType === "boss" ? "BOSS" : "PATH"}
            </span>
            <span className="flex-1 text-sm text-slate-300 font-medium truncate">{n.nodeLabel}</span>
            <span className="font-mono text-xs font-bold shrink-0" style={{ color: deathRateColor(n.deathRate) }}>
              {n.deaths === 0 ? "✓ Clean" : `${n.deaths}💀 · ${n.deathRate.toFixed(0)}%`}
            </span>
          </div>
          <MiniBar value={n.deaths} max={maxDeaths} color={deathRateColor(n.deathRate)} />
          <div className="text-[9px] text-slate-600 mt-1">{n.fights} fights</div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Win/Loss Analysis ───────────────────────────────────────────────────

function WinAnalysisTab({ advanced }: { advanced: AdvancedAnalytics }) {
  const { winCorrelation: wc } = advanced;
  const gap = wc.winAvgSoloRate - wc.lossAvgSoloRate;
  const maxRate = Math.max(wc.winAvgSoloRate, wc.lossAvgSoloRate, 1);

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={<GitBranch className="w-3.5 h-3.5 text-emerald-400" />}
        title="Win / Loss Correlation"
        sub="How alliance efficiency changes between wins and losses"
      />

      {/* Insight card */}
      <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4">
        <div className="text-xs text-emerald-300 font-semibold leading-relaxed">{wc.insight}</div>
      </div>

      {/* Global comparison */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Avg Solo Rate — Wins",   rate: wc.winAvgSoloRate,  n: wc.winSampleSize,  color: "#34d399" },
          { label: "Avg Solo Rate — Losses", rate: wc.lossAvgSoloRate, n: wc.lossSampleSize, color: "#f87171" },
        ].map(({ label, rate, n, color }) => (
          <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">{label}</div>
            <div className="text-3xl font-black font-mono mb-1" style={{ color }}>
              {rate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-600">{n} war{n !== 1 ? "s" : ""} sampled</div>
            <MiniBar value={rate} max={100} color={color} />
          </div>
        ))}
      </div>

      {/* Gap callout */}
      {(wc.winSampleSize > 0 && wc.lossSampleSize > 0) && (
        <div className="text-center py-3 rounded-xl border"
          style={{
            borderColor: gap > 5 ? "#34d39940" : "#fbbf2440",
            backgroundColor: gap > 5 ? "#052e1630" : "#78350f20",
          }}
        >
          <span className="text-sm font-black" style={{ color: gap > 5 ? "#34d399" : "#fbbf24" }}>
            {gap > 0 ? "+" : ""}{gap.toFixed(1)}% efficiency gap
          </span>
          <span className="text-xs text-slate-500 ml-2">between wins and losses</span>
        </div>
      )}

      {/* Per-BG breakdown */}
      <div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3">Per Battlegroup</div>
        <div className="space-y-3">
          {([1, 2, 3] as const).map(bg => {
            const { winAvg, lossAvg, diff } = wc.bgCorrelations[bg] ?? { winAvg: 0, lossAvg: 0, diff: 0 };
            const isCritical = wc.criticalBg === bg;
            return (
              <div
                key={bg}
                className="bg-slate-900/40 border rounded-xl p-3"
                style={{ borderColor: isCritical ? "#f59e0b60" : "#1e293b" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-300">BG{bg}</span>
                    {isCritical && <Pill label="Most Decisive" color="#f59e0b" />}
                  </div>
                  <span className="text-[10px] text-slate-600">{diff.toFixed(1)}% spread</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-[9px] text-emerald-500 mb-0.5">Wins: {winAvg.toFixed(1)}%</div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${winAvg}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] text-red-400 mb-0.5">Losses: {lossAvg.toFixed(1)}%</div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${lossAvg}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: BG Balance ─────────────────────────────────────────────────────────

function BgBalanceTab({
  analytics,
  advanced,
}: {
  analytics: SeasonAnalytics;
  advanced:  AdvancedAnalytics;
}) {
  const { bgBalance } = advanced;
  const maxRate = Math.max(...bgBalance.map(b => b.avgBayesianRate), 1);
  const minRate = Math.min(...bgBalance.map(b => b.avgBayesianRate));
  const imbalance = maxRate - minRate;

  const bgColors: Record<number, string> = { 1: "#ef4444", 2: "#22c55e", 3: "#3b82f6" };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={<Users className="w-3.5 h-3.5 text-violet-400" />}
        title="BG Balance"
        sub="How evenly player strength is distributed across battlegroups"
      />

      {/* Balance indicator */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
        <div
          className="text-3xl font-black font-mono"
          style={{ color: imbalance < 5 ? "#34d399" : imbalance < 15 ? "#fbbf24" : "#f87171" }}
        >
          {imbalance.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {imbalance < 5
            ? "Well balanced — strength is evenly distributed"
            : imbalance < 15
            ? "Slight imbalance — consider redistributing before next season"
            : "Significant imbalance — roster restructuring recommended"}
        </div>
      </div>

      {/* BG cards */}
      <div className="space-y-3">
        {bgBalance.map(bg => {
          const color = bgColors[bg.bgNumber];
          const players = analytics.playerStats
            .filter(p => p.bgNumber === bg.bgNumber - 1)
            .sort((a, b) => b.bayesianSoloRate - a.bayesianSoloRate);

          return (
            <div key={bg.bgNumber} className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60"
                style={{ background: `linear-gradient(90deg, ${color}10 0%, transparent 60%)` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                  <span className="text-sm font-black text-white">Battlegroup {bg.bgNumber}</span>
                  <Pill label={bg.grade} color={soloColor(bg.avgBayesianRate)} />
                </div>
                <div className="text-right">
                  <div className="text-lg font-black font-mono" style={{ color: soloColor(bg.avgBayesianRate) }}>
                    {bg.avgBayesianRate.toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-slate-600">avg adj. rate</div>
                </div>
              </div>

              {/* Player mini-list */}
              <div className="px-4 py-2 space-y-1.5">
                {players.map((p, i) => (
                  <div key={p.playerId} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 w-4 text-right font-mono">{i + 1}</span>
                    <span className="flex-1 text-xs text-slate-300 truncate">{p.playerName}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: soloColor(p.bayesianSoloRate) }}>
                      {p.bayesianSoloRate.toFixed(0)}%
                    </span>
                    <div className="w-16">
                      <MiniBar value={p.bayesianSoloRate} max={100} color={soloColor(p.bayesianSoloRate)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Restructure suggestion */}
      {imbalance >= 15 && (() => {
        const sorted = [...bgBalance].sort((a, b) => b.avgBayesianRate - a.avgBayesianRate);
        const strongest = sorted[0];
        const weakest   = sorted[sorted.length - 1];
        return (
          <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4">
            <div className="text-[10px] text-amber-400 font-black uppercase tracking-wider mb-1">💡 Suggestion</div>
            <div className="text-xs text-amber-200 leading-relaxed">
              BG{strongest.bgNumber} is significantly stronger than BG{weakest.bgNumber} ({(strongest.avgBayesianRate - weakest.avgBayesianRate).toFixed(1)}% gap).
              Consider moving BG{strongest.bgNumber}'s bottom-ranked player to BG{weakest.bgNumber} before the next season to improve balance.
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Tab: Season Trends ───────────────────────────────────────────────────────

function SeasonTrendsTab({ advanced }: { advanced: AdvancedAnalytics }) {
  const { seasonTrends, allianceTrend } = advanced;

  if (seasonTrends.length < 2) {
    return (
      <div className="space-y-4">
        <SectionHeader
          icon={<Layers className="w-3.5 h-3.5 text-indigo-400" />}
          title="Season Trends"
          sub="Season-over-season performance comparison"
        />
        <div className="text-slate-600 text-sm text-center py-12 border border-slate-800 rounded-xl">
          Needs data from at least 2 seasons to show trends.
        </div>
      </div>
    );
  }

  const maxSoloRate = Math.max(...seasonTrends.map(s => s.avgSoloRate), 1);
  const maxWins     = Math.max(...seasonTrends.map(s => s.wins), 1);

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={<Layers className="w-3.5 h-3.5 text-indigo-400" />}
        title="Season Trends"
        sub="Season-over-season performance comparison"
      />

      {/* Alliance trend banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl border"
        style={{
          borderColor:     allianceTrend === "improving" ? "#34d39940" : allianceTrend === "declining" ? "#f8717140" : "#1e293b",
          backgroundColor: allianceTrend === "improving" ? "#052e1620" : allianceTrend === "declining" ? "#450a0a20" : "transparent",
        }}
      >
        {trendIcon(allianceTrend, 16)}
        <span className="text-sm font-semibold text-slate-300">
          Alliance is {allianceTrend === "improving" ? "improving 📈" : allianceTrend === "declining" ? "declining 📉" : "holding steady ➡"} based on recent wars.
        </span>
      </div>

      {/* Season comparison cards */}
      <div className="space-y-3">
        {seasonTrends.map((s, i) => {
          const isLatest = i === seasonTrends.length - 1;
          const prev     = i > 0 ? seasonTrends[i - 1] : null;
          const rateDiff = prev ? s.avgSoloRate - prev.avgSoloRate : null;

          return (
            <div key={s.seasonId}
              className="bg-slate-900/40 border rounded-xl p-4"
              style={{ borderColor: isLatest ? "#6366f140" : "#1e293b" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{s.seasonName}</span>
                    {isLatest && <Pill label="Current" color="#6366f1" />}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{s.wars} wars</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black font-mono" style={{ color: soloColor(s.avgSoloRate) }}>
                    {s.avgSoloRate.toFixed(1)}%
                  </div>
                  {rateDiff !== null && (
                    <div className="text-[10px] flex items-center justify-end gap-0.5"
                      style={{ color: rateDiff >= 0 ? "#34d399" : "#f87171" }}
                    >
                      {rateDiff >= 0 ? "+" : ""}{rateDiff.toFixed(1)}% vs prev
                    </div>
                  )}
                </div>
              </div>

              {/* Bars */}
              <div className="space-y-2">
                <div>
                  <div className="text-[9px] text-slate-600 mb-0.5">Solo Rate</div>
                  <MiniBar value={s.avgSoloRate} max={maxSoloRate} color={soloColor(s.avgSoloRate)} />
                </div>
                <div className="flex gap-3 text-[10px]">
                  <span className="text-emerald-400 font-bold">✓ {s.wins}W</span>
                  <span className="text-red-400 font-bold">✗ {s.losses}L</span>
                  <span className="text-slate-500">{s.winRate.toFixed(0)}% win rate</span>
                  <span className="text-slate-500 ml-auto">{s.totalDeaths}💀 total</span>
                </div>

                {/* Win bar */}
                <div className="flex h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 transition-all" style={{ width: `${s.winRate}%` }} />
                  <div className="bg-red-700 transition-all" style={{ width: `${100 - s.winRate}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Export Panel ─────────────────────────────────────────────────────────────

function ExportPanel({
  analytics,
  advanced,
  wars,
}: {
  analytics: SeasonAnalytics;
  advanced:  AdvancedAnalytics;
  wars:      War[];
}) {
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
        title="Export Data"
        sub="Download alliance statistics as CSV files"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => exportPlayerStatsCSV(analytics, advanced)}
          className="flex items-center gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-cyan-800 hover:bg-slate-800/60 transition-all text-left group"
        >
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-900 shrink-0">
            <Download className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Player Stats CSV</div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              All player metrics incl. consistency, death breakdown, solo rates
            </div>
          </div>
        </button>

        <button
          onClick={() => exportWarStatsCSV(analytics, wars)}
          className="flex items-center gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-cyan-800 hover:bg-slate-800/60 transition-all text-left group"
        >
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-900 shrink-0">
            <Download className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">War History CSV</div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              Per-war results, BG solo rates, deaths, opponent names
            </div>
          </div>
        </button>
      </div>

      <div className="text-[10px] text-slate-600 text-center pt-2">
        CSV files open in Excel, Google Sheets, or any spreadsheet app
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type TabId = "consistency" | "affinity" | "winloss" | "balance" | "trends" | "export";

interface AdvancedInsightsPanelProps {
  analytics: SeasonAnalytics;
  advanced:  AdvancedAnalytics;
  wars:      War[];
}

export function AdvancedInsightsPanel({
  analytics,
  advanced,
  wars,
}: AdvancedInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("consistency");

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "consistency", label: "Consistency",   icon: <BarChart2 className="w-3 h-3" /> },
    { id: "affinity",    label: "Node Affinity", icon: <Target className="w-3 h-3" /> },
    { id: "winloss",     label: "Win Analysis",  icon: <GitBranch className="w-3 h-3" /> },
    { id: "balance",     label: "BG Balance",    icon: <Users className="w-3 h-3" /> },
    { id: "trends",      label: "Trends",        icon: <Layers className="w-3 h-3" /> },
    { id: "export",      label: "Export",        icon: <Download className="w-3 h-3" /> },
  ];

  return (
    <div className="space-y-4 text-slate-200">
      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0"
            style={{
              backgroundColor: activeTab === t.id ? "#334155" : "transparent",
              color:           activeTab === t.id ? "#fff"    : "#64748b",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "consistency" && <ConsistencyTab analytics={analytics} advanced={advanced} />}
      {activeTab === "affinity"    && <NodeAffinityTab analytics={analytics} advanced={advanced} />}
      {activeTab === "winloss"     && <WinAnalysisTab advanced={advanced} />}
      {activeTab === "balance"     && <BgBalanceTab analytics={analytics} advanced={advanced} />}
      {activeTab === "trends"      && <SeasonTrendsTab advanced={advanced} />}
      {activeTab === "export"      && <ExportPanel analytics={analytics} advanced={advanced} wars={wars} />}
    </div>
  );
}