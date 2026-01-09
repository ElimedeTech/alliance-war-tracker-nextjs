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
          // V2.5 structure
          const deaths = (path.primaryDeaths || 0) + (path.backupDeaths || 0);
          pathDeaths += deaths;
          totalDeaths += deaths;

          // Tiered bonus calculation (4 nodes per path)
          const deathsPerNode = Math.ceil(deaths / 4);
          for (let i = 0; i < 4; i++) {
            const nodeDeaths = Math.min(deathsPerNode, deaths - (i * deathsPerNode));
            if (nodeDeaths === 0) bgBonus += 270;
            else if (nodeDeaths === 1) bgBonus += 180;
            else if (nodeDeaths === 2) bgBonus += 90;
          }
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
      <div className="bg-gray-900 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <h2 className="text-3xl font-bold text-yellow-300">War Statistics & Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Wars */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 text-center">
              <div className="text-gray-200 text-sm font-bold mb-2">Total Wars</div>
              <div className="text-5xl font-bold text-white">{totalWars}</div>
            </div>

            {/* Alliance Wins */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 text-center">
              <div className="text-gray-200 text-sm font-bold mb-2">Alliance Wins</div>
              <div className="text-5xl font-bold text-white">{wins}</div>
            </div>

            {/* Alliance Losses */}
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-6 text-center">
              <div className="text-gray-200 text-sm font-bold mb-2">Alliance Losses</div>
              <div className="text-5xl font-bold text-white">{losses}</div>
            </div>

            {/* Win Rate */}
            <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-6 text-center">
              <div className="text-gray-200 text-sm font-bold mb-2">Win Rate</div>
              <div className="text-5xl font-bold text-white">{winRate}%</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Avg Score per War */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">Avg Score per War</div>
              <div className="text-3xl font-bold text-blue-400">{formatNumber(avgScorePerWar)}</div>
            </div>

            {/* Avg Score per BG */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">Avg Score per BG</div>
              <div className="text-3xl font-bold text-blue-400">{formatNumber(avgScorePerBg)}</div>
            </div>

            {/* Total Attack Bonus */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">Total Attack Bonus</div>
              <div className="text-3xl font-bold text-blue-400">{formatNumber(totalAttackBonusAllWars)}</div>
              <div className="text-xs text-gray-500 mt-1">Across all wars</div>
            </div>
          </div>

          {/* Best and Worst Wars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Best War */}
            {bestWar && (
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-lg p-6 border border-green-600">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-xl font-bold text-green-300">Best War</h3>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{bestWar.warName}</div>
                <div className="text-sm text-gray-400 mb-3">{bestWar.date}</div>
                <div className="text-4xl font-bold text-green-400">{formatNumber(bestWar.totalScore)}</div>
                <div className="text-sm text-gray-400 mt-1">Total Score (All 3 BGs)</div>
              </div>
            )}

            {/* Worst War */}
            {worstWar && (
              <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-lg p-6 border border-red-600">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📊</span>
                  <h3 className="text-xl font-bold text-red-300">Lowest Score War</h3>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{worstWar.warName}</div>
                <div className="text-sm text-gray-400 mb-3">{worstWar.date}</div>
                <div className="text-4xl font-bold text-red-400">{formatNumber(worstWar.totalScore)}</div>
                <div className="text-sm text-gray-400 mt-1">Total Score (All 3 BGs)</div>
              </div>
            )}
          </div>

          {/* Alliance Death Breakdown */}
          <div>
            <button
              onClick={() => setShowDeathBreakdown(!showDeathBreakdown)}
              className="flex items-center gap-2 text-xl font-bold text-purple-300 mb-4 hover:text-purple-200 transition"
            >
              <span className={`transform transition-transform ${showDeathBreakdown ? 'rotate-90' : ''}`}>▶</span>
              <span>⚔️</span>
              <span>Alliance Death Breakdown</span>
            </button>

            {showDeathBreakdown && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Path Deaths */}
                <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 rounded-lg p-6 border border-cyan-600">
                  <div className="text-gray-300 text-sm font-bold mb-2">Total Path Deaths</div>
                  <div className="text-5xl font-bold text-cyan-400 mb-2">{totalPathDeaths}</div>
                  <div className="text-xs text-gray-400">Paths 1-9 + Backup Player</div>
                </div>

                {/* Total Boss Deaths */}
                <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-lg p-6 border border-yellow-600">
                  <div className="text-gray-300 text-sm font-bold mb-2">Total Boss Deaths</div>
                  <div className="text-5xl font-bold text-yellow-400 mb-2">{totalBossDeaths}</div>
                  <div className="text-xs text-gray-400">Mini Bosses + Main Boss</div>
                </div>

                {/* Total Deaths */}
                <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-lg p-6 border border-red-600">
                  <div className="text-gray-300 text-sm font-bold mb-2">Total Deaths (All Wars)</div>
                  <div className="text-5xl font-bold text-red-400 mb-2">{totalDeathsAllWars}</div>
                  <div className="text-xs text-gray-400">Across all {totalWars} wars</div>
                </div>
              </div>
            )}
          </div>

          {/* War-by-War Comparison Table */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📋</span>
              <h3 className="text-2xl font-bold text-purple-300">War-by-War Comparison</h3>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-white font-bold">War</th>
                      <th className="px-4 py-3 text-left text-white font-bold">Date</th>
                      <th className="px-4 py-3 text-right text-white font-bold">BG1 Score</th>
                      <th className="px-4 py-3 text-right text-white font-bold">BG2 Score</th>
                      <th className="px-4 py-3 text-right text-white font-bold">BG3 Score</th>
                      <th className="px-4 py-3 text-right text-white font-bold">Total Score</th>
                      <th className="px-4 py-3 text-center text-white font-bold">Alliance Result</th>
                      <th className="px-4 py-3 text-right text-white font-bold">Attack Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warStats.map((stat, index) => (
                      <tr
                        key={stat.warId}
                        className={`border-t border-gray-700 ${
                          index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                        } hover:bg-gray-700 transition`}
                      >
                        <td className="px-4 py-3 text-white font-bold">{stat.warName}</td>
                        <td className="px-4 py-3 text-gray-300">{stat.date}</td>
                        <td className="px-4 py-3 text-right text-blue-400">{formatNumber(stat.bg1Score)}</td>
                        <td className="px-4 py-3 text-right text-blue-400">{formatNumber(stat.bg2Score)}</td>
                        <td className="px-4 py-3 text-right text-blue-400">{formatNumber(stat.bg3Score)}</td>
                        <td className="px-4 py-3 text-right text-yellow-400 font-bold text-lg">
                          {formatNumber(stat.totalScore)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {stat.allianceResult === 'win' && (
                            <div className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                              <span>🏆</span>
                              <span>Win</span>
                            </div>
                          )}
                          {stat.allianceResult === 'loss' && (
                            <div className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                              <span>💀</span>
                              <span>Loss</span>
                            </div>
                          )}
                          {stat.allianceResult === 'pending' && (
                            <div className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                              <span>⏳</span>
                              <span>Pending</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-purple-400">{formatNumber(stat.totalAttackBonus)}</td>
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
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}