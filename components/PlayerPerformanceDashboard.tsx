'use client';

import { useState } from 'react';
import { Player, War, PlayerPerformance } from '@/types';

interface PlayerPerformanceDashboardProps {
  players: Player[];
  wars: War[];
  playerPerformances: PlayerPerformance[];
  onClose: () => void;
}

export default function PlayerPerformanceDashboard({
  players,
  wars,
  playerPerformances,
  onClose
}: PlayerPerformanceDashboardProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'efficiency' | 'deaths' | 'fights'>('efficiency');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [bgFilter, setBgFilter] = useState<'all' | 0 | 1 | 2 | 3>('all');

  const calculatePlayerStats = (playerId: string) => {
    const playerPerfs = playerPerformances.filter(p => p.playerId === playerId);
    const player = players.find(p => p.id === playerId);

    if (!player || playerPerfs.length === 0) {
      return null;
    }

    const totalFights = playerPerfs.reduce((sum, p) => sum + p.totalFights, 0);
    const totalDeaths = playerPerfs.reduce((sum, p) => sum + p.totalDeaths, 0);
    const totalPathFights = playerPerfs.reduce((sum, p) => sum + p.pathFights, 0);
    const totalPathDeaths = playerPerfs.reduce((sum, p) => sum + p.pathDeaths, 0);
    const totalMbFights = playerPerfs.reduce((sum, p) => sum + p.mbFights, 0);
    const totalMbDeaths = playerPerfs.reduce((sum, p) => sum + p.mbDeaths, 0);
    const totalBackupAssists = playerPerfs.reduce((sum, p) => sum + (p.backupAssists || 0), 0);
    const avgDeaths = totalFights > 0 ? totalDeaths / totalFights : 0;

    // Calculate grade
    const grade = avgDeaths <= 0.5 ? 'A+' :
                  avgDeaths <= 0.75 ? 'A' :
                  avgDeaths <= 1.0 ? 'A-' :
                  avgDeaths <= 1.25 ? 'B+' :
                  avgDeaths <= 1.5 ? 'B' :
                  avgDeaths <= 1.75 ? 'B-' :
                  avgDeaths <= 2.0 ? 'C+' :
                  avgDeaths <= 2.5 ? 'C' :
                  avgDeaths <= 3.0 ? 'C-' :
                  avgDeaths <= 4.0 ? 'D' : 'F';

    // Calculate consistency (lower = more consistent)
    const deathVariance = playerPerfs.reduce((sum, p) => {
      const diff = p.averageDeathsPerFight - avgDeaths;
      return sum + (diff * diff);
    }, 0) / playerPerfs.length;
    const consistency = Math.sqrt(deathVariance);

    // Trends
    const recentWars = playerPerfs.slice(-3);
    const olderWars = playerPerfs.slice(0, Math.max(1, playerPerfs.length - 3));
    const recentAvg = recentWars.reduce((sum, p) => sum + p.averageDeathsPerFight, 0) / recentWars.length;
    const olderAvg = olderWars.reduce((sum, p) => sum + p.averageDeathsPerFight, 0) / olderWars.length;
    const trending = recentAvg < olderAvg ? 'improving' : recentAvg > olderAvg ? 'declining' : 'stable';

    return {
      player,
      totalWars: playerPerfs.length,
      totalFights,
      totalDeaths,
      totalPathFights,
      totalPathDeaths,
      totalMbFights,
      totalMbDeaths,
      totalBackupAssists,
      avgDeaths,
      grade,
      consistency,
      trending,
      warPerformances: playerPerfs,
    };
  };

  const allPlayerStats = players
    .map(p => calculatePlayerStats(p.id))
    .filter(stats => stats !== null && stats.totalWars > 0)
    .filter(stats => bgFilter === 'all' || stats!.player.bgAssignment === bgFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a!.player.name.localeCompare(b!.player.name);
        case 'efficiency': return a!.consistency - b!.consistency;
        case 'deaths': return a!.avgDeaths - b!.avgDeaths;
        case 'fights': return b!.totalFights - a!.totalFights;
        default: return 0;
      }
    });

  const selectedPlayerStats = selectedPlayerId ? calculatePlayerStats(selectedPlayerId) : null;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    if (grade.startsWith('D')) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-400';
      case 'declining': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Player Performance Dashboard</h2>
            <p className="text-gray-400 text-sm">
              {allPlayerStats.length} players tracked across {wars.length} wars
            </p>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold">
            Close
          </button>
        </div>

        {!selectedPlayerStats ? (
          <>
            {/* Controls */}
            <div className="mb-6 p-4 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-400">Battlegroup:</label>
                  <select
                    value={bgFilter === 'all' ? 'all' : bgFilter}
                    onChange={(e) => setBgFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as any)}
                    className="px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500"
                  >
                    <option value="all">ALL</option>
                    <option value="0">BG1</option>
                    <option value="1">BG2</option>
                    <option value="2">BG3</option>
                    <option value="3">BG4</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-400">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500"
                  >
                    <option value="efficiency">Efficiency</option>
                    <option value="deaths">Avg Deaths (Low to High)</option>
                    <option value="fights">Total Fights</option>
                    <option value="name">Name</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-600' : 'bg-slate-600'}`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-purple-600' : 'bg-slate-600'}`}
                  >
                    Grid View
                  </button>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl border-2 border-yellow-600/50">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">🏆 Top Performers</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {allPlayerStats.slice(0, 3).map((stats, index) => (
                  <div key={stats!.player.id} className="p-4 bg-slate-700 rounded-lg border-2 border-yellow-600/30">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{['🥇', '🥈', '🥉'][index]}</span>
                      <div>
                        <div className="font-bold text-white">{stats!.player.name}</div>
                        <div className={`text-sm font-bold ${getGradeColor(stats!.grade)}`}>
                          Grade: {stats!.grade}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div>Avg Deaths: {stats!.avgDeaths.toFixed(2)}</div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player List/Grid */}
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {allPlayerStats.map(stats => (
                <div
                  key={stats!.player.id}
                  onClick={() => setSelectedPlayerId(stats!.player.id)}
                  className="p-4 bg-slate-700 rounded-lg border-2 border-slate-600 hover:border-purple-500 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-white text-lg">{stats!.player.name}</h4>
                      <div className="text-sm text-gray-400">
                        BG{stats!.player.bgAssignment !== null ? stats!.player.bgAssignment + 1 : '?'} • {stats!.totalWars} wars
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getGradeColor(stats!.grade)}`}>
                        {stats!.grade}
                      </div>
                      <div className={`text-xs ${getTrendColor(stats!.trending)}`}>
                        {getTrendIcon(stats!.trending)} {stats!.trending}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-slate-600 rounded">
                      <div className="text-gray-400 text-xs">Avg Deaths</div>
                      <div className="font-bold text-red-300">{stats!.avgDeaths.toFixed(2)}</div>
                    </div>
                    <div className="p-2 bg-slate-600 rounded">
                      <div className="text-gray-400 text-xs">Consistency</div>
                      <div className="font-bold text-green-300">{stats!.consistency.toFixed(2)}</div>
                    </div>
                    <div className="p-2 bg-slate-600 rounded">
                      <div className="text-gray-400 text-xs">Total Fights</div>
                      <div className="font-bold text-cyan-300">{stats!.totalFights}</div>
                    </div>
                    <div className="p-2 bg-slate-600 rounded">
                      <div className="text-gray-400 text-xs">Path Deaths</div>
                      <div className="font-bold text-cyan-300">{stats!.totalPathDeaths}</div>
                    </div>
                    <div className="p-2 bg-slate-600 rounded">
                      <div className="text-gray-400 text-xs">MB Deaths</div>
                      <div className="font-bold text-orange-300">{stats!.totalMbDeaths}</div>
                    </div>
                    <div className="p-2 bg-slate-600 rounded">
                      <div className="text-gray-400 text-xs">Backup Assists</div>
                      <div className="font-bold text-yellow-300">{stats!.totalBackupAssists}</div>
                    </div>
                  </div>

                  <button className="w-full mt-3 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold text-sm">
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Player Detail View */}
            <button
              onClick={() => setSelectedPlayerId(null)}
              className="mb-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              ← Back to All Players
            </button>

            <div className="space-y-6">
              {/* Player Header */}
              <div className="p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border-2 border-purple-600/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-white">{selectedPlayerStats.player.name}</h3>
                    <div className="text-gray-400">
                      BG{selectedPlayerStats.player.bgAssignment !== null ? selectedPlayerStats.player.bgAssignment + 1 : '?'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-5xl font-bold ${getGradeColor(selectedPlayerStats.grade)}`}>
                      {selectedPlayerStats.grade}
                    </div>
                    <div className={`text-sm ${getTrendColor(selectedPlayerStats.trending)}`}>
                      {getTrendIcon(selectedPlayerStats.trending)} {selectedPlayerStats.trending}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Total Wars</div>
                    <div className="text-2xl font-bold text-white">{selectedPlayerStats.totalWars}</div>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Total Fights</div>
                    <div className="text-2xl font-bold text-cyan-300">{selectedPlayerStats.totalFights}</div>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Avg Deaths</div>
                    <div className="text-2xl font-bold text-red-300">{selectedPlayerStats.avgDeaths.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Consistency</div>
                    <div className="text-2xl font-bold text-green-300">{selectedPlayerStats.consistency.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="font-bold text-white mb-3">Fight Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Path Fights:</span>
                      <span className="font-bold text-cyan-300">{selectedPlayerStats.totalPathFights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">MB Fights:</span>
                      <span className="font-bold text-orange-300">{selectedPlayerStats.totalMbFights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Backup Assists:</span>
                      <span className="font-bold text-yellow-300">{selectedPlayerStats.totalBackupAssists}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-600 pt-2">
                      <span className="text-gray-300 font-semibold">Total Fights:</span>
                      <span className="font-bold text-white">{selectedPlayerStats.totalFights}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="font-bold text-white mb-3">Deaths Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Path Deaths:</span>
                      <span className="font-bold text-cyan-300">{selectedPlayerStats.totalPathDeaths}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">MB Deaths:</span>
                      <span className="font-bold text-orange-300">{selectedPlayerStats.totalMbDeaths}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-600 pt-2">
                      <span className="text-gray-300 font-semibold">Total Deaths:</span>
                      <span className="font-bold text-red-300">{selectedPlayerStats.totalDeaths}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="font-bold text-white mb-3">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Backup Assists:</span>
                      <span className="font-bold text-yellow-300">🤝 {selectedPlayerStats.totalBackupAssists}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Consistency:</span>
                      <span className="font-bold text-blue-300">
                        {selectedPlayerStats.consistency < 0.5 ? 'Excellent' :
                         selectedPlayerStats.consistency < 1.0 ? 'Good' :
                         selectedPlayerStats.consistency < 1.5 ? 'Fair' : 'Variable'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* War-by-War Performance */}
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="font-bold text-white mb-3">War-by-War Performance</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="p-2 text-left text-gray-400">War</th>
                        <th className="p-2 text-center text-gray-400">Fights</th>
                        <th className="p-2 text-center text-gray-400">Deaths</th>
                        <th className="p-2 text-center text-gray-400">Path Deaths</th>
                        <th className="p-2 text-center text-gray-400">MB Deaths</th>
                        <th className="p-2 text-center text-gray-400">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPlayerStats.warPerformances.map(perf => {
                        const war = wars.find(w => w.id === perf.warId);
                        return (
                          <tr key={perf.id} className="border-b border-slate-600/50">
                            <td className="p-2 font-semibold text-white">{war?.name || 'Unknown'}</td>
                            <td className="p-2 text-center text-cyan-300">{perf.totalFights}</td>
                            <td className="p-2 text-center text-red-300">{perf.totalDeaths}</td>
                            <td className="p-2 text-center text-blue-300">{perf.pathDeaths}</td>
                            <td className="p-2 text-center text-orange-300">{perf.mbDeaths}</td>
                            <td className="p-2 text-center text-purple-300">{perf.averageDeathsPerFight.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
