import { useState, useMemo, useRef } from 'react';
import { War, Player, BgColors, DEFAULT_BG_COLORS } from '@/types';
import { computeSeasonAnalytics } from '@/lib/seasonAnalytics';
import { computeAdvancedAnalytics } from '@/lib/advancedAnalytics';
import { calculateBgStats } from '@/lib/calculations';
import { SeasonStatsView } from './SeasonStatsView';
import { TripleBGView } from './TripleBGView';
import { AdvancedInsightsPanel } from './AdvancedInsightsPanel';
import { PlayerSeasonStats } from '@/lib/seasonAnalytics';

interface StatsModalProps {
  wars: War[];
  players: Player[];
  onClose: () => void;
  bgColors?: BgColors;
  seasons?: Array<{ id: string; name: string }>;
  pathAssignmentMode?: 'split' | 'single';
}

export default function StatsModal({ wars, players, onClose, bgColors, seasons, pathAssignmentMode = 'split' }: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<'season' | 'players' | 'wars' | 'insights'>('season');
  const [bgFilter, setBgFilter] = useState<'all' | 1 | 2 | 3>('all');
  const seasonDetailRef = useRef<HTMLDivElement>(null);
  // Fall back to defaults if not provided
  const resolvedColors: BgColors = bgColors ?? DEFAULT_BG_COLORS;

  const analytics = useMemo(() => computeSeasonAnalytics(wars, players), [wars, players]);
  const advanced  = useMemo(() => computeAdvancedAnalytics(analytics, wars, seasons), [analytics, wars, seasons]);

  // When a player is clicked in TripleBGView, scroll down to SeasonStatsView
  // which handles its own player detail drill-down
  const handleTripleViewPlayerClick = (_player: PlayerSeasonStats) => {
    setTimeout(() => {
      seasonDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const calculatePlayerStats = () => {
    const stats = players.map(player => {
      let totalPathFights = 0;
      let totalMbFights = 0;
      let totalBossFights = 0;
      let totalDeaths = 0;
      let totalPathDeaths = 0;
      let totalMbDeaths = 0;
      let totalBossDeaths = 0;
      let totalFights = 0;
      let perfectClears = 0;

      wars.forEach(war => {
        war.battlegroups.forEach(bg => {
          // Handle V2.5 structure (path-level properties)
          const paths = bg.paths || [];
          paths.forEach(path => {
            // Check if this is V2.5 structure (has assignedPlayerId)
            if ('assignedPlayerId' in path) {
              // V2.5 structure (each path section = 2 fights)
              const pathNoShow = path.playerNoShow ?? false;
              const backupFights = path.backupHelped ? (path.backupFights ?? 1) : 0;
              const primaryFights = 2 - backupFights;

              // Primary slot: skip if they no-showed (replacement covers it instead)
              if (path.assignedPlayerId === player.id && !pathNoShow) {
                totalPathFights += primaryFights;
                totalFights += primaryFights;
                const deaths = (path.primaryDeaths || 0);
                totalDeaths += deaths;
                totalPathDeaths += deaths;
                if (deaths === 0) perfectClears++;
              }
              // Backup: gets only the fights they covered
              if (path.backupHelped && path.backupPlayerId === player.id && backupFights > 0) {
                totalPathFights += backupFights;
                totalFights += backupFights;
                const backupDeaths = (path.backupDeaths || 0);
                totalDeaths += backupDeaths;
                totalPathDeaths += backupDeaths;
              }
              // Replacement for no-show: gets the primary slot's fights and deaths
              if (pathNoShow && path.replacedByPlayerId === player.id) {
                totalPathFights += primaryFights;
                totalFights += primaryFights;
                const deaths = (path.primaryDeaths || 0);
                totalDeaths += deaths;
                totalPathDeaths += deaths;
                if (deaths === 0) perfectClears++;
              }
            } else if ('nodes' in path) {
              // Old structure - has nodes array
              const nodes = (path as any).nodes || [];
              nodes.forEach((node: any) => {
                if (node.assignedPlayer === player.id) {
                  totalPathFights++;
                  totalFights++;
                  const deaths = (node.deaths || 0);
                  totalDeaths += deaths;
                  totalPathDeaths += deaths;
                  if (node.deaths === 0) perfectClears++;
                }
              });
            }
          });

          // Mini bosses (V2.5 only)
          const miniBosses = bg.miniBosses || [];
          miniBosses.forEach(mb => {
            const mbNoShow = mb.playerNoShow ?? false;
            // Primary slot: skip if they no-showed
            if (mb.assignedPlayerId === player.id && !mbNoShow) {
              totalMbFights++;
              totalFights++;
              const deaths = (mb.primaryDeaths || 0);
              totalDeaths += deaths;
              totalMbDeaths += deaths;
              if (deaths === 0) perfectClears++;
            }
            // Backup: only if backup actually helped
            if (mb.backupHelped && mb.backupPlayerId === player.id) {
              totalMbFights++;
              totalFights++;
              const backupDeaths = (mb.backupDeaths || 0);
              totalDeaths += backupDeaths;
              totalMbDeaths += backupDeaths;
            }
            // Replacement for no-show: gets the fight and deaths
            if (mbNoShow && mb.replacedByPlayerId === player.id) {
              totalMbFights++;
              totalFights++;
              const deaths = (mb.primaryDeaths || 0);
              totalDeaths += deaths;
              totalMbDeaths += deaths;
              if (deaths === 0) perfectClears++;
            }
          });

          // Boss
          if (bg.boss) {
            const bossNoShow = bg.boss.playerNoShow ?? false;
            // Primary slot: skip if they no-showed
            if (bg.boss.assignedPlayerId === player.id && !bossNoShow) {
              totalBossFights++;
              totalFights++;
              const deaths = bg.boss.primaryDeaths ?? 0;
              totalDeaths += deaths;
              totalBossDeaths += deaths;
              if (deaths === 0) perfectClears++;
            }
            // Backup boss player
            if (bg.boss.backupHelped && bg.boss.backupPlayerId === player.id) {
              totalBossFights++;
              totalFights++;
              const deaths = bg.boss.backupDeaths ?? 0;
              totalDeaths += deaths;
              totalBossDeaths += deaths;
              if (deaths === 0) perfectClears++;
            }
            // Replacement for no-show
            if (bossNoShow && bg.boss.replacedByPlayerId === player.id) {
              totalBossFights++;
              totalFights++;
              const deaths = bg.boss.primaryDeaths ?? 0;
              totalDeaths += deaths;
              totalBossDeaths += deaths;
              if (deaths === 0) perfectClears++;
            }
          }
        });
      });

      return {
        playerId: player.id,
        playerName: player.name,
        bgAssignment: player.bgAssignment,
        totalPathFights,
        totalMbFights,
        totalBossFights,
        totalPathDeaths,
        totalMbDeaths,
        totalBossDeaths,
        totalFights,
        totalDeaths,
        averageDeathsPerFight: totalFights > 0 ? (totalDeaths / totalFights).toFixed(2) : '0.00',
        perfectClears,
        warsParticipated: wars.length,
      };
    });

    // Filter by BG
    const filtered = bgFilter === 'all'
      ? stats
      : stats.filter(s => s.bgAssignment === bgFilter);

    return filtered.sort((a, b) => b.totalFights - a.totalFights);
  };

  // Calculate war statistics using calculateBgStats from calculations.ts
  // so node counts, bonuses, and deaths are always consistent with the
  // War Overview strip and respect pathAssignmentMode correctly.
  const calculateWarStats = () => {
    return wars.map(war => {
      let totalAttackBonus  = 0;
      let totalDeaths       = 0;
      let totalKills        = 0;
      let totalNodesCleared = 0;

      war.battlegroups.forEach(bg => {
        const bgStats = calculateBgStats(bg, pathAssignmentMode);
        totalDeaths       += bgStats.totalDeaths;
        totalNodesCleared += bgStats.nodesCleared;
        totalAttackBonus  += bgStats.totalBonus;
        totalKills        += (bg.defenderKills || 0);
      });

      // 3 BGs × 50 nodes each = 150 total
      const maxNodes = 150;
      const completionPercentage = ((totalNodesCleared / maxNodes) * 100).toFixed(1);

      return {
        warId:              war.id,
        warName:            war.name,
        totalAttackBonus,
        totalDeaths,
        totalKills,
        avgAttackBonusPerBg: Math.round(totalAttackBonus / 3),
        completionPercentage,
        nodesCleared:       totalNodesCleared,
      };
    });
  };

  const playerStats = calculatePlayerStats();
  const warStats = calculateWarStats();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700/50">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800/95 border-b border-slate-700 p-4 flex justify-between items-center">
          <h2 className="text-lg font-black uppercase tracking-wider text-white">Alliance Stats</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="sticky top-[65px] bg-slate-800/95 border-b border-slate-700 px-4 flex gap-1 pt-2">
          {([
            { id: 'season',   label: 'Season Overview' },
            { id: 'players',  label: 'Player Stats' },
            { id: 'wars',     label: 'War Stats' },
            { id: 'insights', label: '🔬 Insights' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-lg transition-colors ${
                activeTab === t.id
                  ? 'bg-slate-900 text-white border-t border-x border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-6">
          {/* ── Season Overview ── */}
          {activeTab === 'season' && (
            <div className="space-y-8">
              {/* Entry point: three-column BG breakdown */}
              <TripleBGView
                analytics={analytics}
                bgColors={resolvedColors}
                onPlayerClick={handleTripleViewPlayerClick}
              />

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Detailed Analytics
                </span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Deep analytics: insights + player drill-down + nodes */}
              <div ref={seasonDetailRef}>
                <SeasonStatsView analytics={analytics} bgColors={resolvedColors} />
              </div>
            </div>
          )}

          {/* ── Player Statistics ── */}
          {activeTab === 'players' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Player Performance</h3>
                <select
                  value={bgFilter === 'all' ? 'all' : bgFilter}
                  onChange={(e) => setBgFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as any)}
                  className="px-3 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-400 focus:outline-none text-xs font-semibold"
                >
                  <option value="all">All BGs</option>
                  <option value="0">BG1</option>
                  <option value="1">BG2</option>
                  <option value="2">BG3</option>
                </select>
              </div>
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-200 text-xs font-black uppercase tracking-wider">Player</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Path</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">MB</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Boss</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Total Fights</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Avg/Fight</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Perfect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerStats.map((stat, index) => (
                        <tr key={stat.playerId} className={index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-700/20'}>
                          <td className="px-3 py-2 text-white font-semibold text-xs">{stat.playerName}</td>
                          <td className="px-3 py-2 text-center text-xs">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-slate-300">{stat.totalPathFights}</span>
                              {stat.totalPathFights > 0 && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black border ${
                                  stat.totalPathDeaths === 0
                                    ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40'
                                    : 'bg-red-900/40 text-red-400 border-red-700/40'
                                }`}>
                                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C7.03 2 3 6.03 3 11c0 3.1 1.53 5.83 3.88 7.53L7 21h2v1h6v-1h2l.12-2.47C19.47 16.83 21 14.1 21 11c0-4.97-4.03-9-9-9zm-2 15v-2H8l-.5-2H9v-2H8V9h2V7h4v2h2v2h-1v2h1.5L16 15h-2v2h-4z"/>
                                  </svg>
                                  {stat.totalPathDeaths}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center text-xs">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-slate-300">{stat.totalMbFights}</span>
                              {stat.totalMbFights > 0 && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black border ${
                                  stat.totalMbDeaths === 0
                                    ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40'
                                    : 'bg-red-900/40 text-red-400 border-red-700/40'
                                }`}>
                                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C7.03 2 3 6.03 3 11c0 3.1 1.53 5.83 3.88 7.53L7 21h2v1h6v-1h2l.12-2.47C19.47 16.83 21 14.1 21 11c0-4.97-4.03-9-9-9zm-2 15v-2H8l-.5-2H9v-2H8V9h2V7h4v2h2v2h-1v2h1.5L16 15h-2v2h-4z"/>
                                  </svg>
                                  {stat.totalMbDeaths}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center text-xs">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-slate-300">{stat.totalBossFights}</span>
                              {stat.totalBossFights > 0 && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black border ${
                                  stat.totalBossDeaths === 0
                                    ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40'
                                    : 'bg-red-900/40 text-red-400 border-red-700/40'
                                }`}>
                                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C7.03 2 3 6.03 3 11c0 3.1 1.53 5.83 3.88 7.53L7 21h2v1h6v-1h2l.12-2.47C19.47 16.83 21 14.1 21 11c0-4.97-4.03-9-9-9zm-2 15v-2H8l-.5-2H9v-2H8V9h2V7h4v2h2v2h-1v2h1.5L16 15h-2v2h-4z"/>
                                  </svg>
                                  {stat.totalBossDeaths}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center text-blue-300 text-xs">{stat.totalFights}</td>
                          <td className="px-3 py-2 text-center text-yellow-300 text-xs">{stat.averageDeathsPerFight}</td>
                          <td className="px-3 py-2 text-center text-green-300 text-xs">{stat.perfectClears}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── War Statistics ── */}
          {activeTab === 'wars' && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-300 mb-4">War Performance</h3>
              <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-200 text-xs font-black uppercase tracking-wider">War</th>
                        <th className="px-4 py-3 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Nodes Cleared</th>
                        <th className="px-4 py-3 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Completion</th>
                        <th className="px-4 py-3 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Total Bonus</th>
                        <th className="px-4 py-3 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Avg Bonus/BG</th>
                        <th className="px-4 py-3 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Total Deaths</th>
                        <th className="px-4 py-3 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Total Kills</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warStats.map((stat, index) => (
                        <tr key={stat.warId} className={index % 2 === 0 ? 'bg-slate-800/60' : 'bg-slate-700/30'}>
                          <td className="px-4 py-3 text-white font-bold text-xs">{stat.warName}</td>
                          <td className="px-4 py-3 text-center text-slate-300 text-xs">{stat.nodesCleared}/150</td>
                          <td className="px-4 py-3 text-center text-blue-400 text-xs">{stat.completionPercentage}%</td>
                          <td className="px-4 py-3 text-center text-yellow-400 font-bold text-xs">
                            {stat.totalAttackBonus.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center text-green-400 text-xs">
                            {stat.avgAttackBonusPerBg.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center text-red-400 text-xs">{stat.totalDeaths}</td>
                          <td className="px-4 py-3 text-center text-purple-400 text-xs">{stat.totalKills}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Advanced Insights ── */}
          {activeTab === 'insights' && (
            <AdvancedInsightsPanel
              analytics={analytics}
              advanced={advanced}
              wars={wars}
            />
          )}

          {/* Close Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl transition-colors duration-200 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}