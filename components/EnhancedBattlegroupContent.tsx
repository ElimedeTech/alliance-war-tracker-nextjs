import React, { useState } from 'react';
import { Battlegroup, Player } from '@/types';
import MiniBossCard from './MiniBossCard';
import BossCard from './BossCard';

interface EnhancedBattlegroupContentProps {
  battlegroup: Battlegroup;
  bgIndex: number;
  players: Player[];
  onUpdate: (updates: Partial<Battlegroup>) => void;
}

// Helper function to safely convert values to numbers, preventing NaN
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Calculate exploration percentage based on nodes cleared
// Total nodes: 18 paths (9 per section) + 13 mini bosses + 1 boss = 32 nodes
const calculateExploration = (battlegroup: Battlegroup): number => {
  let nodesCleared = 0;
  const totalNodes = 32; // 18 paths + 13 mini bosses + 1 boss

  // Count completed paths (each path = 1 node for exploration purposes)
  const completedPaths = (battlegroup.paths || []).filter(p => p.status === 'completed').length;
  nodesCleared += completedPaths;

  // Count completed mini bosses
  const completedMiniBosses = (battlegroup.miniBosses || []).filter(mb => mb.status === 'completed').length;
  nodesCleared += completedMiniBosses;

  // Check if boss is completed
  if (battlegroup.boss.status === 'completed') {
    nodesCleared += 1;
  }

  // Calculate percentage
  const exploration = Math.round((nodesCleared / totalNodes) * 100);
  return Math.min(100, Math.max(0, exploration)); // Clamp between 0-100
};

// Helper function to calculate attack bonus for a node based on deaths
// Each node starts at 270, loses 90 per death (max 3 deaths = 0 bonus)
const calculateNodeBonus = (deaths: number): number => {
  if (deaths === 0) return 270;
  if (deaths === 1) return 180;
  if (deaths === 2) return 90;
  return 0; // 3+ deaths = 0 bonus
};

// Helper function to calculate boss bonus
// Final boss = 50,000 for completion + 2,000 per node travelled
const calculateBossBonus = (completed: boolean): number => {
  if (!completed) return 0;
  return 50000; // Flat 50,000 for clearing final boss
};

// Helper function to calculate path bonus with 2 nodes per path
// Each node starts at 270, loses 90 per death (max 3 deaths = 0 bonus)
const calculatePathBonus = (totalDeaths: number): number => {
  if (totalDeaths === 0) return 540; // 2 nodes × 270
  
  // Distribute deaths evenly across 2 nodes
  const node1Deaths = Math.ceil(totalDeaths / 2);
  const node2Deaths = totalDeaths - node1Deaths;
  
  let bonus = 0;
  // Node 1
  if (node1Deaths === 0) bonus += 270;
  else if (node1Deaths === 1) bonus += 180;
  else if (node1Deaths === 2) bonus += 90;
  // 3+ deaths = 0
  
  // Node 2
  if (node2Deaths === 0) bonus += 270;
  else if (node2Deaths === 1) bonus += 180;
  else if (node2Deaths === 2) bonus += 90;
  // 3+ deaths = 0
  
  return bonus;
};

export default function EnhancedBattlegroupContent({
  battlegroup,
  bgIndex,
  players,
  onUpdate,
}: EnhancedBattlegroupContentProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    section1: true,
    section2: true,
    miniboss: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  // Calculate BG statistics
  const calculateBgStats = () => {
    let totalDeaths = 0;
    let nodesCleared = 0;
    let totalBonus = 0;

    // Path stats (handle old war format)
    const paths = battlegroup.paths || [];
    paths.forEach(path => {
      const primaryDeaths = safeNumber(path.primaryDeaths);
      const backupDeaths = safeNumber(path.backupDeaths);
      totalDeaths += primaryDeaths + backupDeaths;
      if (path.status === 'completed') nodesCleared += 2;
      else if (path.status === 'in-progress') nodesCleared += 1;

      // Calculate path bonus based on total deaths
      // Max path bonus: 540 (2 nodes × 270)
      const pathDeaths = primaryDeaths + backupDeaths;
      totalBonus += calculatePathBonus(pathDeaths);
    });

    // Mini Boss stats (handle old war format)
    const miniBosses = battlegroup.miniBosses || [];
    miniBosses.forEach(mb => {
      const primaryDeaths = safeNumber(mb.primaryDeaths);
      const backupDeaths = safeNumber(mb.backupDeaths);
      totalDeaths += primaryDeaths + backupDeaths;
      if (mb.status === 'completed') nodesCleared += 1;

      // Calculate MB bonus (single node, max 270)
      const mbDeaths = primaryDeaths + backupDeaths;
      totalBonus += calculateNodeBonus(mbDeaths);
    });

    // Boss stats
    const bossPrimaryDeaths = safeNumber(battlegroup.boss?.primaryDeaths);
    const bossBackupDeaths = safeNumber(battlegroup.boss?.backupDeaths);
    totalDeaths += bossPrimaryDeaths + bossBackupDeaths;
    if (battlegroup.boss?.status === 'completed') {
      nodesCleared += 1;
      // Calculate boss bonus (50,000 flat for completion)
      totalBonus += calculateBossBonus(true);
    }

    return { totalDeaths, nodesCleared, totalBonus };
  };

  const stats = calculateBgStats();
  const currentExploration = calculateExploration(battlegroup);

  // Count assigned players
  const assignedPlayers = new Set<string>();
  const paths = battlegroup.paths || [];
  const miniBosses = battlegroup.miniBosses || [];
  
  paths.forEach(path => {
    if (path.assignedPlayerId) assignedPlayers.add(path.assignedPlayerId);
    if (path.backupPlayerId) assignedPlayers.add(path.backupPlayerId);
    if (path.replacedByPlayerId) assignedPlayers.add(path.replacedByPlayerId);
  });
  miniBosses.forEach(mb => {
    if (mb.assignedPlayerId) assignedPlayers.add(mb.assignedPlayerId);
    if (mb.backupPlayerId) assignedPlayers.add(mb.backupPlayerId);
    if (mb.replacedByPlayerId) assignedPlayers.add(mb.replacedByPlayerId);
  });
  if (battlegroup.boss?.assignedPlayerId) assignedPlayers.add(battlegroup.boss.assignedPlayerId);
  if (battlegroup.boss?.backupPlayerId) assignedPlayers.add(battlegroup.boss.backupPlayerId);
  if (battlegroup.boss?.replacedByPlayerId) assignedPlayers.add(battlegroup.boss.replacedByPlayerId);

  // Handle path updates
  const handlePathUpdate = (pathId: string, updates: any) => {
    const paths = battlegroup.paths || [];
    const updatedPaths = paths.map(path =>
      path.id === pathId ? { ...path, ...updates } : path
    );
    const updatedBg = { paths: updatedPaths };
    
    // Auto-calculate exploration after path update
    const exploration = calculateExploration({ ...battlegroup, ...updatedBg });
    onUpdate({ ...updatedBg, exploration });
  };

  // Handle mini boss updates
  const handleMiniBossUpdate = (mbId: string, updates: any) => {
    const miniBosses = battlegroup.miniBosses || [];
    const updatedMiniBosses = miniBosses.map(mb =>
      mb.id === mbId ? { ...mb, ...updates } : mb
    );
    const updatedBg = { miniBosses: updatedMiniBosses };
    
    // Auto-calculate exploration after mini boss update
    const exploration = calculateExploration({ ...battlegroup, ...updatedBg });
    onUpdate({ ...updatedBg, exploration });
  };

  // Handle boss updates
  const handleBossUpdate = (bossId: string, updates: any) => {
    const updatedBg = {
      boss: {
        ...battlegroup.boss,
        ...updates,
      },
    };
    
    // Auto-calculate exploration after boss update
    const exploration = calculateExploration({ ...battlegroup, ...updatedBg });
    onUpdate({ ...updatedBg, exploration });
  };

  return (
    <div className="space-y-6">
      {/* BG Summary Dashboard */}
      <div className="bg-gray-800 rounded-lg p-4 border border-purple-500">
        <h2 className="text-2xl font-bold text-purple-300 mb-4">
          BG{battlegroup.bgNumber} Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Nodes Cleared</div>
            <div className="text-2xl font-bold text-white">{stats.nodesCleared || 0}/50</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Exploration</div>
            <div className="text-2xl font-bold text-cyan-400">{currentExploration || 0}%</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Total Deaths</div>
            <div className="text-2xl font-bold text-red-400">{stats.totalDeaths || 0}</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Attack Bonus</div>
            <div className="text-2xl font-bold text-yellow-400">{(stats.totalBonus || 0).toLocaleString()}</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Players Active</div>
            <div className="text-2xl font-bold text-blue-400">{assignedPlayers.size || 0}</div>
          </div>
        </div>
        <div className="mt-3 text-center text-sm text-gray-400">
          Max Attack Bonus: 72,950 (18 paths × 1,080 + 13 MBs × 270 + 1 boss × 50,000)
        </div>
      </div>

      {/* Defense Paths Section 1 - Table Layout */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection('section1')}
          className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 transition flex items-center justify-between"
        >
          <span className="text-lg font-bold text-purple-300">War Section 1 (Paths 1-9)</span>
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
              {(battlegroup.paths || []).filter(p => p.section === 1 && p.status === 'completed').length}/9
            </span>
            <span className={`text-gray-400 transform transition-transform ${expandedSections.section1 ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {expandedSections.section1 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-3 py-2 text-left text-white font-semibold">Path</th>
                  <th className="px-3 py-2 text-left text-white font-semibold">Player</th>
                  <th className="px-3 py-2 text-center text-white font-semibold">Deaths</th>
                  <th className="px-3 py-2 text-center text-white font-semibold">No-Show?</th>
                  <th className="px-3 py-2 text-center text-white font-semibold">Backup?</th>
                  <th className="px-3 py-2 text-center text-white font-semibold">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {(battlegroup.paths || []).filter(p => p.section === 1).map((path, idx) => {
                  const pathBonus = calculatePathBonus((path.primaryDeaths || 0) + (path.backupDeaths || 0));
                  const player = players.find(p => p.id === path.assignedPlayerId);
                  const backupPlayer = players.find(p => p.id === path.backupPlayerId);
                  return (
                    <React.Fragment key={path.id}>
                      <tr className={idx % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-700/20'}>
                        <td className="px-3 py-2 text-white font-semibold">P{path.pathNumber}</td>
                        <td className="px-3 py-2 text-cyan-300">{player?.name || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={path.primaryDeaths || 0}
                            onChange={(e) => handlePathUpdate(path.id, { primaryDeaths: safeNumber(e.target.value) })}
                            className="w-12 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-center focus:border-purple-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={path.playerNoShow || false}
                            onChange={(e) => handlePathUpdate(path.id, { playerNoShow: e.target.checked })}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={path.backupHelped || false}
                            onChange={(e) => handlePathUpdate(path.id, { backupHelped: e.target.checked })}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center text-yellow-300 font-bold">{pathBonus.toLocaleString()}</td>
                      </tr>
                      {path.backupHelped && (
                        <tr className={idx % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-700/40'}>
                          <td colSpan={6} className="px-3 py-2">
                            <div className="flex items-center gap-4 bg-gray-700/30 rounded p-3">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-semibold text-gray-300">Backup Player:</span>
                                <select
                                  value={path.backupPlayerId || ''}
                                  onChange={(e) => handlePathUpdate(path.id, { backupPlayerId: e.target.value })}
                                  className="flex-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="">- Select Backup -</option>
                                  {players
                                    .filter(p => battlegroup.players.includes(p.id) && p.id !== path.assignedPlayerId)
                                    .map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-300">Deaths:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={path.backupDeaths || 0}
                                  onChange={(e) => handlePathUpdate(path.id, { backupDeaths: safeNumber(e.target.value) })}
                                  className="w-12 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-center focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Defense Paths Section 2 - Table Layout */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection('section2')}
          className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 transition flex items-center justify-between"
        >
          <span className="text-lg font-bold text-purple-300">War Section 2 (Paths 1-9)</span>
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
              {(battlegroup.paths || []).filter(p => p.section === 2 && p.status === 'completed').length}/9
            </span>
            <span className={`text-gray-400 transform transition-transform ${expandedSections.section2 ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {expandedSections.section2 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-3 py-2 text-left text-white font-semibold">Path</th>
                  <th className="px-3 py-2 text-left text-white font-semibold">Player</th>
                  <th className="px-3 py-2 text-center text-white font-semibold">Deaths</th>
                  <th className="px-3 py-2 text-center text-white font-semibold">No-Show?</th>
                  <th className="px-3 py-2 text-center text-white font-semibold">Backup?</th>
                  <th className="px-3 py-2 text-center text-white font-semibold">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {(battlegroup.paths || []).filter(p => p.section === 2).map((path, idx) => {
                  const pathBonus = calculatePathBonus((path.primaryDeaths || 0) + (path.backupDeaths || 0));
                  const player = players.find(p => p.id === path.assignedPlayerId);
                  const backupPlayer = players.find(p => p.id === path.backupPlayerId);
                  return (
                    <React.Fragment key={path.id}>
                      <tr className={idx % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-700/20'}>
                        <td className="px-3 py-2 text-white font-semibold">P{path.pathNumber}</td>
                        <td className="px-3 py-2 text-cyan-300">{player?.name || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={path.primaryDeaths || 0}
                            onChange={(e) => handlePathUpdate(path.id, { primaryDeaths: safeNumber(e.target.value) })}
                            className="w-12 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-center focus:border-purple-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={path.playerNoShow || false}
                            onChange={(e) => handlePathUpdate(path.id, { playerNoShow: e.target.checked })}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={path.backupHelped || false}
                            onChange={(e) => handlePathUpdate(path.id, { backupHelped: e.target.checked })}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center text-yellow-300 font-bold">{pathBonus.toLocaleString()}</td>
                      </tr>
                      {path.backupHelped && (
                        <tr className={idx % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-700/40'}>
                          <td colSpan={6} className="px-3 py-2">
                            <div className="flex items-center gap-4 bg-gray-700/30 rounded p-3">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-semibold text-gray-300">Backup Player:</span>
                                <select
                                  value={path.backupPlayerId || ''}
                                  onChange={(e) => handlePathUpdate(path.id, { backupPlayerId: e.target.value })}
                                  className="flex-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="">- Select Backup -</option>
                                  {players
                                    .filter(p => battlegroup.players.includes(p.id) && p.id !== path.assignedPlayerId)
                                    .map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-300">Deaths:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={path.backupDeaths || 0}
                                  onChange={(e) => handlePathUpdate(path.id, { backupDeaths: safeNumber(e.target.value) })}
                                  className="w-12 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-center focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mini Bosses & Final Boss Section - Expandable */}
      {battlegroup.miniBosses && battlegroup.miniBosses.length > 0 ? (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <button
            onClick={() => toggleSection('miniboss')}
            className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 transition flex items-center justify-between"
          >
            <span className="text-lg font-bold text-orange-300">Mini Bosses (Nodes 37-49) & Final Boss (Node 50)</span>
            <div className="flex items-center gap-2">
              <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold">
                {battlegroup.miniBosses.filter(mb => mb.status === 'completed').length}/13 + {battlegroup.boss?.status === 'completed' ? '1' : '0'}/1
              </span>
              <span className={`text-gray-400 transform transition-transform ${expandedSections.miniboss ? 'rotate-180' : ''}`}>▼</span>
            </div>
          </button>

          {expandedSections.miniboss && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {battlegroup.miniBosses.map((miniBoss) => (
                  <MiniBossCard
                    key={miniBoss.id}
                    miniBoss={miniBoss}
                    bgIndex={bgIndex}
                    players={players}
                    onUpdate={handleMiniBossUpdate}
                  />
                ))}
                <BossCard 
                  boss={battlegroup.boss} 
                  bgIndex={bgIndex} 
                  players={players} 
                  onUpdate={handleBossUpdate} 
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-yellow-300 mb-2">⚠️ Old War Format</h3>
          <p className="text-gray-300 mb-4">
            This war was created before V2.5 Enhanced and doesn't have mini boss tracking.
          </p>
          <p className="text-sm text-gray-400">
            Create a new war to use the V2.5 features (path-level assignments, backup tracking, mini bosses, etc.)
          </p>
        </div>
      )}
    </div>
  );
}