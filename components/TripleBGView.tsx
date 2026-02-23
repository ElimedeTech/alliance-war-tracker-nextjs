"use client";

/**
 * TripleBGView.tsx
 *
 * Side-by-side three-column BG breakdown, matching CereBro's season overview layout.
 * Shows all three battlegroups simultaneously so underperformers are immediately visible.
 *
 * USAGE — add above your SeasonStatsView in StatsModal:
 *
 *   import { TripleBGView } from "./TripleBGView";
 *   import { computeSeasonAnalytics } from "@/lib/seasonAnalytics";
 *
 *   const analytics = useMemo(
 *     () => computeSeasonAnalytics(wars, players),
 *     [wars, players]
 *   );
 *   <TripleBGView analytics={analytics} bgColors={bgColors} />
 */

import { useMemo, useState } from "react";
import { SeasonAnalytics, PlayerSeasonStats } from "@/lib/seasonAnalytics";
import { Skull, Users, ChevronDown, ChevronUp } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_COLORS = { 1: "#ef4444", 2: "#22c55e", 3: "#3b82f6" };

function soloColor(rate: number): string {
  if (rate >= 95) return "#34d399"; // emerald
  if (rate >= 80) return "#93c5fd"; // sky
  if (rate >= 60) return "#fbbf24"; // amber
  return "#f87171";                 // red
}

function deathColor(deaths: number): string {
  if (deaths === 0) return "#34d399";
  if (deaths <= 2) return "#fbbf24";
  return "#f87171";
}

function getInitials(name: string): string {
  return name
    .split(/[\s_-]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Stable avatar background colours based on name hash
function avatarBg(name: string): string {
  const colors = [
    "#1e3a5f", "#3b1f2b", "#1a2e1a", "#2d1b4e",
    "#1f2d3d", "#3b2a1a", "#1a2d2d", "#2e1a2e",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function PlayerAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = getInitials(name);
  const bg = avatarBg(name);
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: size * 0.35,
        border: "1.5px solid rgba(255,255,255,0.08)",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Single BG Column ─────────────────────────────────────────────────────────

interface BGColumnProps {
  bgNumber: 1 | 2 | 3;
  players: PlayerSeasonStats[];
  totals: { fights: number; deaths: number; soloRate: number };
  color: string;
  totalWars: number;
  onPlayerClick?: (player: PlayerSeasonStats) => void;
}

const INITIAL_VISIBLE = 10;

function BGColumn({
  bgNumber,
  players,
  totals,
  color,
  totalWars,
  onPlayerClick,
}: BGColumnProps) {
  const [expanded, setExpanded] = useState(false);
  const visiblePlayers = expanded ? players : players.slice(0, INITIAL_VISIBLE);
  const hasMore = players.length > INITIAL_VISIBLE;

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border transition-all duration-300"
      style={{
        borderColor: `${color}30`,
        backgroundColor: "rgba(2,6,23,0.6)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Column header */}
      <div
        className="px-4 py-4 border-b"
        style={{
          borderColor: `${color}25`,
          background: `linear-gradient(135deg, ${color}12 0%, transparent 60%)`,
        }}
      >
        {/* BG name row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span className="text-base font-black uppercase tracking-widest text-white">
              Battlegroup {bgNumber}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
            style={{
              backgroundColor: `${color}15`,
              color: color,
              border: `1px solid ${color}30`,
            }}
          >
            <Users className="w-3 h-3" />
            {players.length} Players
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total Stats:
          </span>
          <div className="flex items-center gap-3">
            <span
              className="text-lg font-black font-mono"
              style={{ color: soloColor(totals.soloRate) }}
            >
              {totals.soloRate.toFixed(0)}%
            </span>
            <div className="flex items-center gap-1 text-red-400">
              <Skull className="w-3.5 h-3.5" />
              <span className="text-sm font-black font-mono">{totals.deaths}</span>
            </div>
          </div>
        </div>

        {/* Solo rate progress bar */}
        <div className="mt-2 h-1 bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${totals.soloRate}%`,
              backgroundColor: soloColor(totals.soloRate),
            }}
          />
        </div>
      </div>

      {/* Table header */}
      <div
        className="grid gap-1 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 border-b"
        style={{
          gridTemplateColumns: "20px 1fr 40px 52px 44px",
          borderColor: `${color}15`,
          backgroundColor: "rgba(15,23,42,0.4)",
        }}
      >
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Fights</span>
        <span className="text-right">Solo%</span>
        <span className="text-right">Deaths</span>
      </div>

      {/* Player rows */}
      <div className="flex-1 divide-y divide-slate-800/30">
        {players.length === 0 && (
          <div className="py-8 text-center text-slate-600 text-xs font-bold">
            No data yet
          </div>
        )}
        {visiblePlayers.map((player, idx) => {
          const participationPct =
            totalWars > 0 ? (player.warsParticipated / totalWars) * 100 : 0;

          return (
            <button
              key={player.playerId}
              onClick={() => onPlayerClick?.(player)}
              className="w-full group transition-colors duration-150 hover:bg-slate-800/40"
            >
              <div
                className="grid items-center gap-1 px-3 py-2.5"
                style={{ gridTemplateColumns: "20px 1fr 40px 52px 44px" }}
              >
                {/* Rank */}
                <span
                  className="text-[10px] font-black text-right"
                  style={{ color: idx < 3 ? color : "#475569" }}
                >
                  {idx + 1}
                </span>

                {/* Player */}
                <div className="flex items-center gap-2 min-w-0">
                  <PlayerAvatar name={player.playerName} size={26} />
                  <div className="min-w-0 text-left">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors block truncate leading-tight">
                      {player.playerName}
                    </span>
                    {/* Participation dots */}
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: totalWars }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor:
                              i < player.warsParticipated
                                ? color
                                : "rgba(71,85,105,0.4)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fights */}
                <span className="text-xs font-mono font-bold text-slate-400 text-right">
                  {player.totalFights}
                </span>

                {/* Solo % */}
                <span
                  className="text-xs font-black font-mono text-right"
                  style={{ color: soloColor(player.overallSoloRate) }}
                >
                  {player.overallSoloRate.toFixed(0)}%
                </span>

                {/* Deaths */}
                <span
                  className="text-xs font-black font-mono text-right"
                  style={{ color: deathColor(player.totalDeaths) }}
                >
                  {player.totalDeaths}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expand / collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors border-t"
          style={{
            borderColor: `${color}20`,
            color: expanded ? "#64748b" : color,
            backgroundColor: expanded ? "transparent" : `${color}08`,
          }}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              {players.length - INITIAL_VISIBLE} More Players
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TripleBGViewProps {
  analytics: SeasonAnalytics;
  bgColors?: { 1: string; 2: string; 3: string };
  /** Optional: called when a player row is clicked — use to open detail view */
  onPlayerClick?: (player: PlayerSeasonStats) => void;
}

export function TripleBGView({
  analytics,
  bgColors = DEFAULT_COLORS,
  onPlayerClick,
}: TripleBGViewProps) {
  const bgPlayers = useMemo(() => {
    const result: Record<number, PlayerSeasonStats[]> = { 1: [], 2: [], 3: [] };
    for (const p of analytics.playerStats) {
      const bgNum = p.bgNumber + 1; // bgNumber is 0-indexed in analytics
      if (bgNum >= 1 && bgNum <= 3) result[bgNum].push(p);
    }
    return result;
  }, [analytics.playerStats]);

  return (
    <div className="space-y-3">
      {/* Global summary strip */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">
          Alliance Roster — {analytics.totalWars} Wars
        </span>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            <span className="font-black text-slate-300">{analytics.globalFights}</span> fights
          </span>
          <span className="flex items-center gap-1 text-red-400/80">
            <Skull className="w-3 h-3" />
            <span className="font-black">{analytics.globalDeaths}</span>
          </span>
          <span
            className="font-black text-sm font-mono"
            style={{ color: soloColor(analytics.globalSoloRate) }}
          >
            {analytics.globalSoloRate.toFixed(1)}% global
          </span>
        </div>
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([1, 2, 3] as const).map((bg) => (
          <BGColumn
            key={bg}
            bgNumber={bg}
            players={bgPlayers[bg]}
            totals={analytics.bgTotals[bg]}
            color={bgColors[bg]}
            totalWars={analytics.totalWars}
            onPlayerClick={onPlayerClick}
          />
        ))}
      </div>
    </div>
  );
}