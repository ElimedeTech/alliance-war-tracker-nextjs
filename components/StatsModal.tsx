import { useState, useMemo, useRef } from 'react';
import { War, Player, BgColors, DEFAULT_BG_COLORS } from '@/types';
import { computeSeasonAnalytics } from '@/lib/seasonAnalytics';
import { SeasonStatsView } from './SeasonStatsView';
import { TripleBGView } from './TripleBGView';
import { PlayerSeasonStats } from '@/lib/seasonAnalytics';

interface StatsModalProps {
  wars: War[];
  players: Player[];
  onClose: () => void;
  bgColors?: BgColors;
}

export default function StatsModal({ wars, players, onClose, bgColors }: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<'season' | 'players' | 'wars'>('season');
  const [bgFilter, setBgFilter] = useState<'all' | 1 | 2 | 3>('all');
  const seasonDetailRef = useRef<HTMLDivElement>(null);
  // Fall back to defaults if not provided
  const resolvedColors: BgColors = bgColors ?? DEFAULT_BG_COLORS;

  const analytics = useMemo(() => computeSeasonAnalytics(wars, players), [wars, players]);

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
      let totalDeaths = 0;
      let totalPathDeaths = 0;
      let totalMbDeaths = 0;
      let totalFights = 0;
      let perfectClears = 0;

      wars.forEach(war => {
        war.battlegroups.forEach(bg => {
          // Handle V2.5 structure (path-level properties)
          const paths = bg.paths || [];
          paths.forEach(path => {
            // Check if this is V2.5 structure (has assignedPlayerId)
            if ('assignedPlayerId' in path) {
              // V2.5 structure
              if (path.assignedPlayerId === player.id) {
                totalPathFights++;
                totalFights++;
                const deaths = (path.primaryDeaths || 0);
                totalDeaths += deaths;
                totalPathDeaths += deaths;
                if (deaths === 0) perfectClears++;
              }
              if (path.backupPlayerId === player.id) {
                totalPathFights++;
                totalFights++;
                const backupDeaths = (path.backupDeaths || 0);
                totalDeaths += backupDeaths;
                totalPathDeaths += backupDeaths;
              }
              if (path.replacedByPlayerId === player.id) {
                totalPathFights++;
                totalFights++;
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
            if (mb.assignedPlayerId === player.id) {
              totalMbFights++;
              totalFights++;
              const deaths = (mb.primaryDeaths || 0);
              totalDeaths += deaths;
              totalMbDeaths += deaths;
              if (deaths === 0) perfectClears++;
            }
            if (mb.backupPlayerId === player.id) {
              totalMbFights++;
              totalFights++;
              const backupDeaths = (mb.backupDeaths || 0);
              totalDeaths += backupDeaths;
              totalMbDeaths += backupDeaths;
            }
            if (mb.replacedByPlayerId === player.id) {
              totalMbFights++;
              totalFights++;
            }
          });

          // Boss
          if (bg.boss && bg.boss.assignedPlayerId === player.id) {
            totalFights++;
            totalDeaths += (bg.boss.primaryDeaths + bg.boss.backupDeaths || 0);
            if ((bg.boss.primaryDeaths + bg.boss.backupDeaths) === 0) perfectClears++;
          }
        });
      });

      return {
        playerId: player.id,
        playerName: player.name,
        bgAssignment: player.bgAssignment,
        totalPathFights,
        totalMbFights,
        totalPathDeaths,
        totalMbDeaths,
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

  // Calculate war statistics
  const calculateWarStats = () => {
    return wars.map(war => {
      let totalAttackBonus = 0;
      let totalDeaths = 0;
      let totalKills = 0;
      let totalNodesCleared = 0;

      war.battlegroups.forEach(bg => {
        // Handle V2.5 structure
        const paths = bg.paths || [];
        paths.forEach(path => {
          if ('assignedPlayerId' in path) {
            // V2.5 structure: 2 nodes per path per section
            const pathDeaths = (path.primaryDeaths || 0) + (path.backupDeaths || 0);
            totalDeaths += pathDeaths;

            // Tiered bonus: 2 nodes per path, split deaths evenly
            const node1Deaths = Math.ceil(pathDeaths / 2);
            const node2Deaths = pathDeaths - node1Deaths;

            let pathBonus = 0;
            if (node1Deaths === 0) pathBonus += 270;
            else if (node1Deaths === 1) pathBonus += 180;
            else if (node1Deaths === 2) pathBonus += 90;

            if (node2Deaths === 0) pathBonus += 270;
            else if (node2Deaths === 1) pathBonus += 180;
            else if (node2Deaths === 2) pathBonus += 90;

            totalAttackBonus += pathBonus;
            totalNodesCleared += 2;
          } else if ('nodes' in path) {
            // Old structure
            const nodes = (path as any).nodes || [];
            nodes.forEach((node: any) => {
              totalDeaths += (node.deaths || 0);
              if (node.deaths === 0) totalAttackBonus += 270;
              else if (node.deaths === 1) totalAttackBonus += 180;
              else if (node.deaths === 2) totalAttackBonus += 90;
              if (node.status === 'completed') totalNodesCleared++;
            });
          }
        });

        // Mini bosses (V2.5)
        const miniBosses = bg.miniBosses || [];
        miniBosses.forEach(mb => {
          const mbDeaths = (mb.primaryDeaths || 0) + (mb.backupDeaths || 0);
          totalDeaths += mbDeaths;
          totalAttackBonus += 270;
          totalNodesCleared += 1;
        });

        // Boss
        if (bg.boss) {
          totalDeaths += (bg.boss.primaryDeaths + bg.boss.backupDeaths || 0);
          totalAttackBonus += 50000;
          totalNodesCleared += 1;
        }

        totalKills += (bg.defenderKills || 0);
      });

      const maxNodes = 150;
      const completionPercentage = ((totalNodesCleared / maxNodes) * 100).toFixed(1);

      return {
        warId: war.id,
        warName: war.name,
        totalAttackBonus,
        totalDeaths,
        totalKills,
        avgAttackBonusPerBg: Math.round(totalAttackBonus / 3),
        completionPercentage,
        nodesCleared: totalNodesCleared,
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
            { id: 'season', label: 'Season Overview' },
            { id: 'players', label: 'Player Stats' },
            { id: 'wars',   label: 'War Stats' },
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
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">BG</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Path Fights</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Path Deaths</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">MB Fights</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">MB Deaths</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Total</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Deaths</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Avg/Fight</th>
                        <th className="px-3 py-2 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Perfect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerStats.map((stat, index) => (
                        <tr key={stat.playerId} className={index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-700/20'}>
                          <td className="px-3 py-2 text-white font-semibold text-xs">{stat.playerName}</td>
                          <td className="px-3 py-2 text-center text-purple-300 text-xs">{stat.bgAssignment === -1 ? '-' : `BG${stat.bgAssignment + 1}`}</td>
                          <td className="px-3 py-2 text-center text-slate-300 text-xs">{stat.totalPathFights}</td>
                          <td className="px-3 py-2 text-center text-red-300 text-xs">{stat.totalPathDeaths}</td>
                          <td className="px-3 py-2 text-center text-slate-300 text-xs">{stat.totalMbFights}</td>
                          <td className="px-3 py-2 text-center text-red-300 text-xs">{stat.totalMbDeaths}</td>
                          <td className="px-3 py-2 text-center text-blue-300 text-xs">{stat.totalFights}</td>
                          <td className="px-3 py-2 text-center text-red-300 text-xs">{stat.totalDeaths}</td>
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
                          <td className="px-4 py-3 text-center text-slate-300 text-xs">{stat.nodesCleared}/96</td>
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