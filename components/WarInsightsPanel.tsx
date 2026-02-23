"use client";

/**
 * WarInsightsPanel.tsx
 *
 * Adapted from CereBro's season-insights.tsx pattern.
 * Shows hardest nodes as clickable cards — clicking one fires onNodeClick,
 * which you can use to scroll to a detail view and pre-select the node.
 *
 * Also shows top-performing and most-struggling players as quick-glance cards.
 *
 * USAGE — inside StatsModal, between TripleBGView and SeasonStatsView:
 *
 *   import { WarInsightsPanel } from "./WarInsightsPanel";
 *
 *   const detailRef = useRef<HTMLDivElement>(null);
 *   const [focusedNode, setFocusedNode] = useState<string | null>(null);
 *
 *   const handleNodeClick = (nodeLabel: string) => {
 *     setFocusedNode(nodeLabel);
 *     setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
 *   };
 *
 *   <WarInsightsPanel analytics={analytics} onNodeClick={handleNodeClick} />
 *   <div ref={detailRef}>
 *     <SeasonStatsView analytics={analytics} focusedNode={focusedNode} />
 *   </div>
 */

import { useMemo } from "react";
import { SeasonAnalytics, NodeHeatEntry, PlayerSeasonStats } from "@/lib/seasonAnalytics";
import { Skull, TrendingUp, TrendingDown, Flame, Target } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function soloColor(rate: number): string {
  if (rate >= 95) return "#34d399";
  if (rate >= 80) return "#93c5fd";
  if (rate >= 60) return "#fbbf24";
  return "#f87171";
}

function nodeTypeLabel(type: NodeHeatEntry["nodeType"]): string {
  if (type === "boss") return "BOSS";
  if (type === "mini-boss") return "MB";
  return "PATH";
}

function nodeTypeBg(type: NodeHeatEntry["nodeType"]): string {
  if (type === "boss") return "rgba(239,68,68,0.15)";
  if (type === "mini-boss") return "rgba(249,115,22,0.12)";
  return "rgba(100,116,139,0.12)";
}

function nodeTypeBorder(type: NodeHeatEntry["nodeType"]): string {
  if (type === "boss") return "rgba(239,68,68,0.3)";
  if (type === "mini-boss") return "rgba(249,115,22,0.25)";
  return "rgba(100,116,139,0.2)";
}

function nodeTypeColor(type: NodeHeatEntry["nodeType"]): string {
  if (type === "boss") return "#f87171";
  if (type === "mini-boss") return "#fb923c";
  return "#94a3b8";
}

function getInitials(name: string): string {
  return name.split(/[\s_-]/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function avatarBg(name: string): string {
  const colors = ["#1e3a5f","#3b1f2b","#1a2e1a","#2d1b4e","#1f2d3d","#3b2a1a","#1a2d2d","#2e1a2e"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({
  icon,
  title,
  sub,
  color = "#94a3b8",
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div
        className="p-1.5 rounded-lg"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">{title}</h3>
        {sub && <p className="text-[10px] text-slate-600 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

function NodeCard({
  node,
  rank,
  onClick,
}: {
  node: NodeHeatEntry;
  rank: number;
  onClick: () => void;
}) {
  const heatIntensity = Math.min(1, node.deathRate / 100);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group"
      style={{
        backgroundColor: nodeTypeBg(node.nodeType),
        border: `1px solid ${nodeTypeBorder(node.nodeType)}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <span
          className="text-xs font-black font-mono w-4 shrink-0 mt-0.5"
          style={{ color: rank <= 3 ? "#f87171" : "#475569" }}
        >
          {rank}
        </span>

        {/* Node info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: nodeTypeBg(node.nodeType),
                color: nodeTypeColor(node.nodeType),
                border: `1px solid ${nodeTypeBorder(node.nodeType)}`,
              }}
            >
              {nodeTypeLabel(node.nodeType)}
            </span>
            <span className="text-xs font-semibold text-slate-300 truncate">
              {node.nodeLabel}
            </span>
          </div>

          {/* Death rate bar */}
          <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, node.deathRate)}%`,
                background: `linear-gradient(90deg, #f59e0b, #ef4444)`,
                opacity: 0.7 + heatIntensity * 0.3,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
            <span>{node.fights} fights</span>
            <span className="text-red-400">
              {node.deaths}💀 · {node.deathRate.toFixed(0)}% rate
            </span>
          </div>
        </div>

        {/* Arrow hint */}
        <span className="text-slate-700 group-hover:text-slate-400 transition-colors text-xs shrink-0 mt-1">
          →
        </span>
      </div>
    </button>
  );
}

function PlayerCard({
  player,
  variant,
  onClick,
}: {
  player: PlayerSeasonStats;
  variant: "star" | "struggling";
  onClick?: () => void;
}) {
  const color = variant === "star" ? "#34d399" : "#f87171";
  const icon = variant === "star"
    ? <TrendingUp className="w-3 h-3" />
    : <TrendingDown className="w-3 h-3" />;

  const bgColor = avatarBg(player.playerName);
  const initials = getInitials(player.playerName);
  const bgNum = player.bgNumber + 1;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-3 transition-all duration-200 hover:scale-[1.01] group"
      style={{
        backgroundColor: `${color}08`,
        border: `1px solid ${color}20`,
      }}
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
          style={{ backgroundColor: bgColor, border: "1.5px solid rgba(255,255,255,0.08)" }}
        >
          {initials}
        </div>

        {/* Name + BG */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
              {player.playerName}
            </span>
            <span className="text-[9px] font-black text-slate-600 shrink-0">BG{bgNum}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px]">
            <span className="text-slate-500">{player.totalFights}f</span>
            <span style={{ color }}>{player.overallSoloRate.toFixed(0)}%</span>
            {player.totalDeaths > 0 && (
              <span className="text-red-400/80">{player.totalDeaths}💀</span>
            )}
          </div>
        </div>

        {/* Icon */}
        <div style={{ color }} className="shrink-0">
          {icon}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface WarInsightsPanelProps {
  analytics: SeasonAnalytics;
  /** Called when a node card is clicked — use to scroll to detail + pre-select */
  onNodeClick?: (node: NodeHeatEntry) => void;
  /** Called when a player card is clicked */
  onPlayerClick?: (player: PlayerSeasonStats) => void;
}

export function WarInsightsPanel({
  analytics,
  onNodeClick,
  onPlayerClick,
}: WarInsightsPanelProps) {
  // Top 5 hardest nodes
  const hardestNodes = analytics.hardestNodes.slice(0, 5);

  // Top 3 star performers (highest solo rate, min 3 fights)
  const starPlayers = useMemo(() => {
    return [...analytics.playerStats]
      .filter((p) => p.totalFights >= 3)
      .sort((a, b) => {
        if (b.overallSoloRate !== a.overallSoloRate)
          return b.overallSoloRate - a.overallSoloRate;
        return b.totalFights - a.totalFights;
      })
      .slice(0, 3);
  }, [analytics.playerStats]);

  // Top 3 struggling (most deaths, min 3 fights)
  const strugglingPlayers = useMemo(() => {
    return [...analytics.playerStats]
      .filter((p) => p.totalFights >= 3 && p.totalDeaths > 0)
      .sort((a, b) => b.totalDeaths - a.totalDeaths || a.overallSoloRate - b.overallSoloRate)
      .slice(0, 3);
  }, [analytics.playerStats]);

  if (analytics.totalWars === 0) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Flame className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-black uppercase tracking-wider text-white">
            War Insights
          </h2>
          <p className="text-[10px] text-slate-500 font-medium">
            Click any card to drill into details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Hardest Nodes */}
        <div className="sm:col-span-1 space-y-1">
          <SectionTitle
            icon={<Target className="w-3.5 h-3.5" />}
            title="Hardest Nodes"
            sub="By total deaths across all wars"
            color="#f59e0b"
          />
          {hardestNodes.length === 0 ? (
            <p className="text-xs text-slate-600 py-4 text-center">No node data yet</p>
          ) : (
            <div className="space-y-2">
              {hardestNodes.map((node, i) => (
                <NodeCard
                  key={`${node.nodeLabel}-${i}`}
                  node={node}
                  rank={i + 1}
                  onClick={() => onNodeClick?.(node)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Star Performers */}
        <div className="space-y-1">
          <SectionTitle
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            title="Top Performers"
            sub="Highest solo rate (min 3 fights)"
            color="#34d399"
          />
          {starPlayers.length === 0 ? (
            <p className="text-xs text-slate-600 py-4 text-center">Not enough data yet</p>
          ) : (
            <div className="space-y-2">
              {starPlayers.map((player) => (
                <PlayerCard
                  key={player.playerId}
                  player={player}
                  variant="star"
                  onClick={() => onPlayerClick?.(player)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Needs Attention */}
        <div className="space-y-1">
          <SectionTitle
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            title="Needs Attention"
            sub="Most deaths (min 3 fights)"
            color="#f87171"
          />
          {strugglingPlayers.length === 0 ? (
            <p className="text-xs text-slate-600 py-4 text-center">
              {analytics.globalDeaths === 0
                ? "No deaths recorded 🎉"
                : "Not enough data yet"}
            </p>
          ) : (
            <div className="space-y-2">
              {strugglingPlayers.map((player) => (
                <PlayerCard
                  key={player.playerId}
                  player={player}
                  variant="struggling"
                  onClick={() => onPlayerClick?.(player)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}