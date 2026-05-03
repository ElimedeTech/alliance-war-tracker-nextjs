import { useState, useMemo, useRef } from 'react';
import { War, Player, BgColors, DEFAULT_BG_COLORS } from '@/types';
import { computeSeasonAnalytics } from '@/lib/seasonAnalytics';
import { computeAdvancedAnalytics } from '@/lib/advancedAnalytics';
import { calculateBgStats, getCountablePaths, fightsPerPathRecord } from '@/lib/calculations';
import { SeasonStatsView } from './SeasonStatsView';
import { TripleBGView } from './TripleBGView';
import { AdvancedInsightsPanel } from './AdvancedInsightsPanel';
import { PlayerSeasonStats } from '@/lib/seasonAnalytics';

interface StatsModalProps {
  wars: War[];
  players: Player[];
  onClose: () => void;
  bgColors?: BgColors;
  seasons?: Array<{ id: string; name: string; warIds?: string[] }>;
  pathAssignmentMode?: 'split' | 'single';
}

export default function StatsModal({ wars, players, onClose, bgColors, seasons, pathAssignmentMode = 'split' }: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<'season' | 'players' | 'wars' | 'insights'>('season');
  // bgFilter uses 0-indexed bgAssignment values (0=BG1, 1=BG2, 2=BG3) to match
  // player.bgAssignment; 'all' means no filter.
  const [bgFilter, setBgFilter] = useState<'all' | 0 | 1 | 2>('all');
  // Persist the selected season across modal open/close via localStorage
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(() => {
    try { return localStorage.getItem('aw-tracker-selected-season') ?? 'all'; } catch { return 'all'; }
  });

  const handleSeasonChange = (id: string) => {
    setSelectedSeasonId(id);
    try { localStorage.setItem('aw-tracker-selected-season', id); } catch { /* ignore */ }
  };
  const seasonDetailRef = useRef<HTMLDivElement>(null);
  // Holds the player selected from TripleBGView so SeasonStatsView can open their detail.
  const [tripleViewSelectedPlayer, setTripleViewSelectedPlayer] = useState<PlayerSeasonStats | null>(null);

  // When a player is clicked in TripleBGView, select them and scroll to SeasonStatsView
  // which will open their detail panel directly.
  const handleTripleViewPlayerClick = (player: PlayerSeasonStats) => {
    setTripleViewSelectedPlayer(player);
    setTimeout(() => {
      seasonDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Fall back to defaults if not provided
  const resolvedColors: BgColors = bgColors ?? DEFAULT_BG_COLORS;

  // Filter wars to the selected season, or use all wars if 'all' is selected.
  // This is the single source-of-truth for every analytics computation below.
  //
  // Two-tier filter strategy:
  //   1. If season.warIds is populated, use it (most precise — handles wars moved between seasons).
  //   2. Otherwise fall back to war.seasonId matching — covers wars created before warIds
  //      tracking was added, or when MainApp hasn't yet passed warIds down.
  const filteredWars = useMemo(() => {
    if (selectedSeasonId === 'all') return wars;
    const season = (seasons ?? []).find(s => s.id === selectedSeasonId);
    if (!season) return [];
    if (season.warIds?.length) {
      const idSet = new Set(season.warIds);
      return wars.filter(w => idSet.has(w.id));
    }
    // Fallback: match by the seasonId stamped on each war at creation time
    return wars.filter(w => w.seasonId === selectedSeasonId);
  }, [wars, seasons, selectedSeasonId]);

  const analytics = useMemo(() => computeSeasonAnalytics(filteredWars, players, pathAssignmentMode), [filteredWars, players, pathAssignmentMode]);
  const advanced  = useMemo(() => computeAdvancedAnalytics(analytics, filteredWars, seasons), [analytics, filteredWars, seasons]);

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

      filteredWars.forEach(war => {
        (war.battlegroups || []).forEach(bg => {
          // Use canonical functions — single source of truth for path counting
          const paths = getCountablePaths(bg.paths || [], pathAssignmentMode);
          const fightsPerRecord = fightsPerPathRecord(pathAssignmentMode);
          paths.forEach(path => {
            // Check if this is V2.5 structure (has assignedPlayerId)
            if ('assignedPlayerId' in path) {
              const pathNoShow = path.playerNoShow ?? false;
              const backupFights = path.backupHelped ? (path.backupFights ?? 1) : 0;
              const primaryFights = fightsPerRecord - backupFights;

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
        // Count only wars where the player was actually assigned somewhere,
        // not all wars in the list.
        warsParticipated: filteredWars.filter(w =>
          (w.battlegroups || []).some(bg => {
            const onPath = (bg.paths || []).some(p =>
              p.assignedPlayerId === player.id ||
              (p.backupHelped && p.backupPlayerId === player.id) ||
              (p.playerNoShow && p.replacedByPlayerId === player.id)
            );
            const onMb = (bg.miniBosses || []).some(m =>
              m.assignedPlayerId === player.id ||
              (m.backupHelped && m.backupPlayerId === player.id) ||
              (m.playerNoShow && m.replacedByPlayerId === player.id)
            );
            const onBoss = !!bg.boss && (
              bg.boss.assignedPlayerId === player.id ||
              (bg.boss.backupHelped && bg.boss.backupPlayerId === player.id) ||
              (bg.boss.playerNoShow && bg.boss.replacedByPlayerId === player.id)
            );
            return onPath || onMb || onBoss;
          })
        ).length,
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
    return filteredWars.map(war => {
      let totalAttackBonus  = 0;
      let totalDeaths       = 0;
      let totalKills        = 0;
      let totalNodesCleared = 0;

      (war.battlegroups || []).forEach(bg => {
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

  const playerStats = useMemo(() => calculatePlayerStats(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredWars, players, bgFilter, pathAssignmentMode]);

  const warStats = useMemo(() => calculateWarStats(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredWars, pathAssignmentMode]);

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

          {/* ── Season Selector ── filters all analytics tabs */}
          {seasons && seasons.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
                Viewing:
              </span>
              <select
                value={selectedSeasonId}
                onChange={e => handleSeasonChange(e.target.value)}
                className="flex-1 max-w-xs bg-slate-800 text-white text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-600 focus:border-purple-500 focus:outline-none transition-colors"
              >
                <option value="all">All Wars ({wars.length})</option>
                {seasons.map(s => {
                  // Use warIds count if available, otherwise count by war.seasonId
                  const count = s.warIds?.length ?? wars.filter(w => w.seasonId === s.id).length;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({count} war{count !== 1 ? 's' : ''})
                    </option>
                  );
                })}
              </select>
              {selectedSeasonId !== 'all' && (
                <span className="text-[10px] text-purple-400 font-bold shrink-0">
                  {filteredWars.length} war{filteredWars.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

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
                <SeasonStatsView
                  analytics={analytics}
                  bgColors={resolvedColors}
                  initialSelectedPlayer={tripleViewSelectedPlayer}
                  onInitialPlayerConsumed={() => setTripleViewSelectedPlayer(null)}
                />
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
                  onChange={(e) => setBgFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as 0 | 1 | 2)}
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
              wars={filteredWars}
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