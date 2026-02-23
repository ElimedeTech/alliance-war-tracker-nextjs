import { War } from '@/types';
import { useState } from 'react';

interface WarComparisonDashboardProps {
  wars: War[];
  onClose: () => void;
}

export default function WarComparisonDashboard({ wars, onClose }: WarComparisonDashboardProps) {
  const [showDeathBreakdown, setShowDeathBreakdown] = useState(true);

  // Calculate war statistics
  const calculateWarStats = (war: War) => {
    let bg1Score = 0;
    let bg2Score = 0;
    let bg3Score = 0;
    let totalAttackBonus = 0;
    let totalDeaths = 0;
    let pathDeaths = 0;
    let bossDeaths = 0;

    war.battlegroups.forEach((bg, index) => {
      let bgScore = 0;
      let bgBonus = 0;

      // Calculate path stats (V2.5 structure)
      const paths = bg.paths || [];
      paths.forEach(path => {
        if ('assignedPlayerId' in path) {
          // V2.5 structure: 2 nodes per path per section
          const deaths = (path.primaryDeaths || 0) + (path.backupDeaths || 0);
          pathDeaths += deaths;
          totalDeaths += deaths;

          // Tiered bonus calculation: 2 nodes per path, split deaths evenly
          // Bonus per node: 0 deaths=270, 1 death=180, 2 deaths=90, 3+=0
          const node1Deaths = Math.ceil(deaths / 2);
          const node2Deaths = deaths - node1Deaths;
          
          // Node 1
          if (node1Deaths === 0) bgBonus += 270;
          else if (node1Deaths === 1) bgBonus += 180;
          else if (node1Deaths === 2) bgBonus += 90;
          // 3+ deaths = 0
          
          // Node 2
          if (node2Deaths === 0) bgBonus += 270;
          else if (node2Deaths === 1) bgBonus += 180;
          else if (node2Deaths === 2) bgBonus += 90;
          // 3+ deaths = 0
        } else if ('nodes' in path) {
          // Old structure
          const nodes = (path as any).nodes || [];
          nodes.forEach((node: any) => {
            const nodeDeaths = node.deaths || 0;
            pathDeaths += nodeDeaths;
            totalDeaths += nodeDeaths;
            if (nodeDeaths === 0) bgBonus += 270;
            else if (nodeDeaths === 1) bgBonus += 180;
            else if (nodeDeaths === 2) bgBonus += 90;
          });
        }
      });

      // Mini bosses (V2.5)
      const miniBosses = bg.miniBosses || [];
      miniBosses.forEach(mb => {
        const deaths = (mb.primaryDeaths || 0) + (mb.backupDeaths || 0);
        bossDeaths += deaths;
        totalDeaths += deaths;
        if (deaths === 0) bgBonus += 270;
        else if (deaths === 1) bgBonus += 180;
        else if (deaths === 2) bgBonus += 90;
      });

      // Boss
      if (bg.boss) {
        const deaths = bg.boss.primaryDeaths + bg.boss.backupDeaths || 0;
        bossDeaths += deaths;
        totalDeaths += deaths;
        if (bg.boss.status === 'completed') bgBonus += 50000; // Flat 50,000 for boss completion
      }

      bgScore = bgBonus + (bg.defenderKills || 0) * 150;
      totalAttackBonus += bgBonus;

      if (index === 0) bg1Score = bgScore;
      else if (index === 1) bg2Score = bgScore;
      else if (index === 2) bg3Score = bgScore;
    });

    const totalScore = bg1Score + bg2Score + bg3Score;

    return {
      warId: war.id,
      warName: war.name,
      date: war.startDate || 'N/A',
      bg1Score,
      bg2Score,
      bg3Score,
      totalScore,
      totalAttackBonus,
      totalDeaths,
      pathDeaths,
      bossDeaths,
      allianceResult: war.allianceResult || 'pending',
    };
  };

  // Calculate all war stats
  const warStats = wars.map(calculateWarStats);

  // Overall statistics
  const totalWars = wars.length;
  const wins = warStats.filter(w => w.allianceResult === 'win').length;
  const losses = warStats.filter(w => w.allianceResult === 'loss').length;
  const winRate = totalWars > 0 ? ((wins / totalWars) * 100).toFixed(0) : '0';
  
  const totalScoreAllWars = warStats.reduce((sum, w) => sum + w.totalScore, 0);
  const avgScorePerWar = totalWars > 0 ? Math.round(totalScoreAllWars / totalWars) : 0;
  const avgScorePerBg = totalWars > 0 ? Math.round(totalScoreAllWars / (totalWars * 3)) : 0;
  
  const totalAttackBonusAllWars = warStats.reduce((sum, w) => sum + w.totalAttackBonus, 0);
  const totalPathDeaths = warStats.reduce((sum, w) => sum + w.pathDeaths, 0);
  const totalBossDeaths = warStats.reduce((sum, w) => sum + w.bossDeaths, 0);
  const totalDeathsAllWars = warStats.reduce((sum, w) => sum + w.totalDeaths, 0);

  // Best and worst wars
  const bestWar = warStats.length > 0 ? [...warStats].sort((a, b) => b.totalScore - a.totalScore)[0] : null;
  const worstWar = warStats.length > 0 ? [...warStats].sort((a, b) => a.totalScore - b.totalScore)[0] : null;

  // Format numbers with commas
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 border-b border-slate-700 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <h2 className="text-xl font-black uppercase tracking-wider text-yellow-300">War Statistics & Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-700/30">
              <div className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">Total Wars</div>
              <div className="text-3xl font-black text-white">{totalWars}</div>
            </div>
            <div className="bg-green-900/30 rounded-xl p-4 text-center border border-green-700/30">
              <div className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">Alliance Wins</div>
              <div className="text-3xl font-black text-green-300">{wins}</div>
            </div>
            <div className="bg-red-900/30 rounded-xl p-4 text-center border border-red-700/30">
              <div className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">Losses</div>
              <div className="text-3xl font-black text-red-300">{losses}</div>
            </div>
            <div className="bg-orange-900/30 rounded-xl p-4 text-center border border-orange-700/30">
              <div className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">Win Rate</div>
              <div className="text-3xl font-black text-orange-300">{winRate}%</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">Avg Score/War</div>
              <div className="text-xl font-black text-blue-300">{formatNumber(avgScorePerWar)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">Avg Score/BG</div>
              <div className="text-xl font-black text-blue-300">{formatNumber(avgScorePerBg)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-wider">Total Attack Bonus</div>
              <div className="text-xl font-black text-purple-300">{formatNumber(totalAttackBonusAllWars)}</div>
            </div>
          </div>

          {/* Best and Worst Wars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Best War */}
            {bestWar && (
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-600/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏆</span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-green-300">Best War</h3>
                </div>
                <div className="text-lg font-black text-white mb-1">{bestWar.warName}</div>
                <div className="text-xs text-slate-400 mb-3">{bestWar.date}</div>
                <div className="text-3xl font-black text-green-400">{formatNumber(bestWar.totalScore)}</div>
                <div className="text-xs text-slate-400 mt-1">Total Score (All 3 BGs)</div>
              </div>
            )}

            {/* Worst War */}
            {worstWar && (
              <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-6 border border-red-600/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📊</span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-red-300">Lowest Score War</h3>
                </div>
                <div className="text-lg font-black text-white mb-1">{worstWar.warName}</div>
                <div className="text-xs text-slate-400 mb-3">{worstWar.date}</div>
                <div className="text-3xl font-black text-red-400">{formatNumber(worstWar.totalScore)}</div>
                <div className="text-xs text-slate-400 mt-1">Total Score (All 3 BGs)</div>
              </div>
            )}
          </div>

          {/* Alliance Death Breakdown */}
          <div>
            <button
              onClick={() => setShowDeathBreakdown(!showDeathBreakdown)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-300 mb-4 hover:text-purple-200 transition-colors"
            >
              <span className={`transform transition-transform ${showDeathBreakdown ? 'rotate-90' : ''}`}>▶</span>
              <span>⚔️</span>
              <span>Alliance Death Breakdown</span>
            </button>

            {showDeathBreakdown && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Path Deaths */}
                <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 rounded-xl p-6 border border-cyan-600/50">
                  <div className="text-slate-300 text-xs font-black uppercase tracking-wider mb-2">Total Path Deaths</div>
                  <div className="text-4xl font-black text-cyan-400 mb-2">{totalPathDeaths}</div>
                  <div className="text-xs text-slate-400">Paths 1-9 + Backup Player</div>
                </div>

                {/* Total Boss Deaths */}
                <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-xl p-6 border border-yellow-600/50">
                  <div className="text-slate-300 text-xs font-black uppercase tracking-wider mb-2">Total Boss Deaths</div>
                  <div className="text-4xl font-black text-yellow-400 mb-2">{totalBossDeaths}</div>
                  <div className="text-xs text-slate-400">Mini Bosses + Main Boss</div>
                </div>

                {/* Total Deaths */}
                <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-6 border border-red-600/50">
                  <div className="text-slate-300 text-xs font-black uppercase tracking-wider mb-2">Total Deaths (All Wars)</div>
                  <div className="text-4xl font-black text-red-400 mb-2">{totalDeathsAllWars}</div>
                  <div className="text-xs text-slate-400">Across all {totalWars} wars</div>
                </div>
              </div>
            )}
          </div>

          {/* War-by-War Comparison Table */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📋</span>
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-300">War-by-War Comparison</h3>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-200 text-xs font-black uppercase tracking-wider">War</th>
                      <th className="px-4 py-3 text-left text-slate-200 text-xs font-black uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-right text-slate-200 text-xs font-black uppercase tracking-wider">BG1 Score</th>
                      <th className="px-4 py-3 text-right text-slate-200 text-xs font-black uppercase tracking-wider">BG2 Score</th>
                      <th className="px-4 py-3 text-right text-slate-200 text-xs font-black uppercase tracking-wider">BG3 Score</th>
                      <th className="px-4 py-3 text-right text-slate-200 text-xs font-black uppercase tracking-wider">Total Score</th>
                      <th className="px-4 py-3 text-center text-slate-200 text-xs font-black uppercase tracking-wider">Alliance Result</th>
                      <th className="px-4 py-3 text-right text-slate-200 text-xs font-black uppercase tracking-wider">Attack Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warStats.map((stat, index) => (
                      <tr
                        key={stat.warId}
                        className={`border-t border-slate-700 ${
                          index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700/30'
                        } hover:bg-slate-700 transition-colors`}
                      >
                        <td className="px-4 py-3 text-white font-black text-sm">{stat.warName}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{stat.date}</td>
                        <td className="px-4 py-3 text-right text-blue-400 text-sm">{formatNumber(stat.bg1Score)}</td>
                        <td className="px-4 py-3 text-right text-blue-400 text-sm">{formatNumber(stat.bg2Score)}</td>
                        <td className="px-4 py-3 text-right text-blue-400 text-sm">{formatNumber(stat.bg3Score)}</td>
                        <td className="px-4 py-3 text-right text-yellow-400 font-black text-base">
                          {formatNumber(stat.totalScore)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {stat.allianceResult === 'win' && (
                            <div className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-black">
                              <span>🏆</span>
                              <span>Win</span>
                            </div>
                          )}
                          {stat.allianceResult === 'loss' && (
                            <div className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black">
                              <span>💀</span>
                              <span>Loss</span>
                            </div>
                          )}
                          {stat.allianceResult === 'pending' && (
                            <div className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black">
                              <span>⏳</span>
                              <span>Pending</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-purple-400 text-sm">{formatNumber(stat.totalAttackBonus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}