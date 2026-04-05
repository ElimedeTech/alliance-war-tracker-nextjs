"use client";

/**
 * BattlegroupSummary.tsx
 *
 * Adapted from CereBro's season-overview-view pattern.
 * Shows per-BG solo rate, fights, deaths as clickable filter cards.
 * Clicking a BG card filters the player list in SeasonStatsView.
 *
 * Props come directly from SeasonAnalytics (seasonAnalytics.ts).
 */

import { SeasonAnalytics } from "@/lib/seasonAnalytics";

interface BattlegroupSummaryProps {
  analytics: SeasonAnalytics;
  selectedBg: 1 | 2 | 3 | null;
  onSelectBg: (bg: 1 | 2 | 3 | null) => void;
  /** Optional hex colours, e.g. { 1: "#ef4444", 2: "#22c55e", 3: "#3b82f6" } */
  bgColors?: { 1: string; 2: string; 3: string };
}

const DEFAULT_COLORS: { 1: string; 2: string; 3: string } = {
  1: "#ef4444",
  2: "#22c55e",
  3: "#3b82f6",
};

function soloRateLabel(rate: number): string {
  if (rate >= 95) return "Elite";
  if (rate >= 85) return "Strong";
  if (rate >= 70) return "Average";
  return "Struggling";
}

function soloRateGrade(rate: number): string {
  if (rate >= 95) return "S";
  if (rate >= 85) return "A";
  if (rate >= 70) return "B";
  if (rate >= 55) return "C";
  return "D";
}

export function BattlegroupSummary({
  analytics,
  selectedBg,
  onSelectBg,
  bgColors = DEFAULT_COLORS,
}: BattlegroupSummaryProps) {
  const bgs = [1, 2, 3] as const;

  // Global death distribution percentages
  const { deathDistribution } = analytics;
  const total = deathDistribution.total || 1;
  const pathPct = Math.round((deathDistribution.path / total) * 100);
  const mbPct = Math.round((deathDistribution.miniBoss / total) * 100);
  const bossPct = Math.round((deathDistribution.boss / total) * 100);

  return (
    <div className="p-4 sm:p-6 space-y-4 border-b border-slate-800/60 bg-slate-900/20">
      {/* BG Cards */}
      <div className="grid grid-cols-3 gap-3">
        {bgs.map((bg) => {
          const t = analytics.bgTotals[bg];
          const color = bgColors[bg];
          const isSelected = selectedBg === bg;
          const isOtherSelected = selectedBg !== null && selectedBg !== bg;
          const grade = soloRateGrade(t.soloRate);
          const label = soloRateLabel(t.soloRate);

          // Count players in this BG
          const playerCount = analytics.playerStats.filter(
            (p) => p.bgNumber === bg - 1
          ).length;

          return (
            <button
              key={bg}
              onClick={() => onSelectBg(isSelected ? null : bg)}
              className={[
                "relative overflow-hidden rounded-xl p-3 sm:p-4 text-left transition-all duration-300",
                "border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                isSelected
                  ? "scale-[1.02] shadow-lg"
                  : isOtherSelected
                  ? "opacity-40 scale-[0.98]"
                  : "hover:scale-[1.01] hover:shadow-md",
              ].join(" ")}
              style={{
                borderColor: isSelected ? color : `${color}30`,
                backgroundColor: isSelected ? `${color}12` : "rgba(15,23,42,0.5)",
                boxShadow: isSelected ? `0 0 20px ${color}25` : undefined,
              }}
            >
              {/* Glow strip at top */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  opacity: isSelected ? 1 : 0.3,
                }}
              />

              {/* BG Label + Grade */}
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: color,
                      boxShadow: isSelected ? `0 0 6px ${color}` : "none",
                    }}
                  />
                  <span
                    className="text-xs font-black uppercase tracking-widest"
                    style={{ color: isSelected ? color : "#94a3b8" }}
                  >
                    BG{bg}
                  </span>
                </div>
                {/* Grade badge */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black transition-all"
                  style={{
                    backgroundColor: isSelected ? `${color}25` : "rgba(30,41,59,0.8)",
                    color: isSelected ? color : "#64748b",
                    border: `1px solid ${isSelected ? color + "50" : "#1e293b"}`,
                  }}
                >
                  {grade}
                </div>
              </div>

              {/* Solo Rate — the headline number */}
              <div className="mb-2">
                <span
                  className="text-2xl sm:text-3xl font-black font-mono leading-none tracking-tighter transition-colors duration-300"
                  style={{ color: isSelected ? color : "#e2e8f0" }}
                >
                  {t.soloRate.toFixed(1)}%
                </span>
                <span className="block text-[9px] font-bold uppercase text-slate-500 tracking-widest mt-0.5">
                  {label}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-slate-800/80 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${t.soloRate}%`,
                    backgroundColor: color,
                    opacity: isSelected ? 1 : 0.6,
                  }}
                />
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-500">
                  {t.fights}
                  <span className="font-normal text-slate-600"> fights</span>
                </span>
                <span style={{ color: `${color}99` }}>
                  {t.deaths}
                  <span className="font-normal text-slate-600"> deaths</span>
                </span>
                <span className="text-slate-600">
                  {playerCount}p
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Global death distribution bar */}
      {deathDistribution.total > 0 && (
        <div className="space-y-1.5">
          {/* Segmented bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
            <div
              className="bg-slate-500 transition-all duration-500"
              style={{ width: `${pathPct}%` }}
            />
            <div
              className="bg-orange-500/70 transition-all duration-500"
              style={{ width: `${mbPct}%` }}
            />
            <div
              className="bg-red-500/80 transition-all duration-500"
              style={{ width: `${bossPct}%` }}
            />
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold px-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
              Path {deathDistribution.path} ({pathPct}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500/70 inline-block" />
              MB {deathDistribution.miniBoss} ({mbPct}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/80 inline-block" />
              Boss {deathDistribution.boss} ({bossPct}%)
            </span>
            <span className="ml-auto text-slate-600">
              {selectedBg
                ? `Showing BG${selectedBg} · click to clear`
                : "Click BG to filter"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}