import { useState } from 'react';
import { War, Player } from '@/types';

interface StatsModalProps {
  wars: War[];
  players: Player[];
  onClose: () => void;
}

export default function StatsModal({ wars, players, onClose }: StatsModalProps) {
  const [bgFilter, setBgFilter] = useState<'all' | 1 | 2 | 3>('all');
  // Calculate player statistics
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
            // V2.5 structure
            const pathDeaths = (path.primaryDeaths || 0) + (path.backupDeaths || 0);
            totalDeaths += pathDeaths;
            
            // Calculate tiered bonus
            const deathsPerNode = Math.ceil(pathDeaths / 4);
            for (let i = 0; i < 4; i++) {
              const nodeDeaths = Math.min(deathsPerNode, pathDeaths - (i * deathsPerNode));
              if (nodeDeaths === 0) totalAttackBonus += 270;
              else if (nodeDeaths === 1) totalAttackBonus += 180;
              else if (nodeDeaths === 2) totalAttackBonus += 90;
            }

            if (path.status === 'completed') totalNodesCleared += 4;
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
          if (mbDeaths === 0) totalAttackBonus += 270;
          else if (mbDeaths === 1) totalAttackBonus += 180;
          else if (mbDeaths === 2) totalAttackBonus += 90;
          if (mb.status === 'completed') totalNodesCleared++;
        });

        // Boss
        if (bg.boss) {
          totalDeaths += (bg.boss.primaryDeaths + bg.boss.backupDeaths || 0);
          if (bg.boss.status === 'completed') {
            totalAttackBonus += 50000; // Flat 50,000 for boss completion
            totalNodesCleared++;
          }
        }

        totalKills += (bg.defenderKills || 0);
      });

      const maxNodes = 150; // 50 nodes × 3 BGs
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
      <div className="bg-gray-900 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-purple-300">Alliance Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Player Statistics */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-blue-300">Player Performance</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Filter by BG:</label>
                <select
                  value={bgFilter === 'all' ? 'all' : bgFilter}
                  onChange={(e) => setBgFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as any)}
                  className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
                >
                  <option value="all">ALL</option>
                  <option value="0">BG1</option>
                  <option value="1">BG2</option>
                  <option value="2">BG3</option>
                </select>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-white">Player</th>
                      <th className="px-4 py-3 text-left text-white">BG</th>
                      <th className="px-4 py-3 text-center text-white">Path Fights</th>
                      <th className="px-4 py-3 text-center text-white">MB Fights</th>
                      <th className="px-4 py-3 text-center text-white">Total Fights</th>
                      <th className="px-4 py-3 text-center text-white">Path Deaths</th>
                      <th className="px-4 py-3 text-center text-white">MB Deaths</th>
                      <th className="px-4 py-3 text-center text-white">Total Deaths</th>
                      <th className="px-4 py-3 text-center text-white">Avg Deaths</th>
                      <th className="px-4 py-3 text-center text-white">Perfect Clears</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.map((stat, index) => (
                      <tr key={stat.playerId} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                        <td className="px-4 py-3 text-white font-bold">{stat.playerName}</td>
                        <td className="px-4 py-3 text-purple-300">{stat.bgAssignment === -1 ? 'Unassigned' : `BG${stat.bgAssignment + 1}`}</td>
                        <td className="px-4 py-3 text-center text-gray-300">{stat.totalPathFights}</td>
                        <td className="px-4 py-3 text-center text-gray-300">{stat.totalMbFights}</td>
                        <td className="px-4 py-3 text-center text-blue-400 font-bold">{stat.totalFights}</td>
                        <td className="px-4 py-3 text-center text-cyan-400">{stat.totalPathDeaths}</td>
                        <td className="px-4 py-3 text-center text-orange-400">{stat.totalMbDeaths}</td>
                        <td className="px-4 py-3 text-center text-red-400">{stat.totalDeaths}</td>
                        <td className="px-4 py-3 text-center text-yellow-400">{stat.averageDeathsPerFight}</td>
                        <td className="px-4 py-3 text-center text-green-400">{stat.perfectClears}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* War Statistics */}
          <div>
            <h3 className="text-2xl font-bold text-orange-300 mb-4">War Performance</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-white">War</th>
                      <th className="px-4 py-3 text-center text-white">Nodes Cleared</th>
                      <th className="px-4 py-3 text-center text-white">Completion</th>
                      <th className="px-4 py-3 text-center text-white">Total Bonus</th>
                      <th className="px-4 py-3 text-center text-white">Avg Bonus/BG</th>
                      <th className="px-4 py-3 text-center text-white">Total Deaths</th>
                      <th className="px-4 py-3 text-center text-white">Total Kills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warStats.map((stat, index) => (
                      <tr key={stat.warId} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                        <td className="px-4 py-3 text-white font-bold">{stat.warName}</td>
                        <td className="px-4 py-3 text-center text-gray-300">{stat.nodesCleared}/150</td>
                        <td className="px-4 py-3 text-center text-blue-400">{stat.completionPercentage}%</td>
                        <td className="px-4 py-3 text-center text-yellow-400 font-bold">
                          {stat.totalAttackBonus.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center text-green-400">
                          {stat.avgAttackBonusPerBg.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center text-red-400">{stat.totalDeaths}</td>
                        <td className="px-4 py-3 text-center text-purple-400">{stat.totalKills}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center">
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