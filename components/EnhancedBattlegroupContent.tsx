import React, { useState } from 'react';
import { Battlegroup, Player, Path } from '@/types';
import { nodeBonus as calculateNodeBonus, pathBonus as calculatePathBonus, bossBonus as calculateBossBonus } from '@/lib/calculations';


interface EnhancedBattlegroupContentProps {
  battlegroup: Battlegroup;
  bgIndex: number;
  players: Player[];
  pathAssignmentMode?: 'split' | 'single';
  onUpdate: (updates: Partial<Battlegroup>) => void;
}

// Helper function to safely convert values to numbers, preventing NaN
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Calculate exploration percentage based on nodes cleared
// Uses same pathNodeCount logic as calculateBgStats so they stay in sync
const calculateExploration = (battlegroup: Battlegroup, pathAssignmentMode: 'split' | 'single' = 'split'): number => {
  const pathNodeCount = pathAssignmentMode === 'single' ? 4 : 2;
  const inProgressNodeCount = pathAssignmentMode === 'single' ? 2 : 1;
  let nodesCleared = 0;

  (battlegroup.paths || []).forEach(path => {
    if (path.status === 'completed') nodesCleared += pathNodeCount;
    else if (path.status === 'in-progress') nodesCleared += inProgressNodeCount;
  });

  (battlegroup.miniBosses || []).forEach(mb => {
    if (mb.status === 'completed') nodesCleared += 1;
  });

  if (battlegroup.boss?.status === 'completed') nodesCleared += 1;

  return Math.min(100, Math.round((nodesCleared / 50) * 100));
};


export default function EnhancedBattlegroupContent({
  battlegroup,
  bgIndex,
  players,
  pathAssignmentMode = 'split',
  onUpdate,
}: EnhancedBattlegroupContentProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'recording'>('recording');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    section1: true,
    section2: true,
    miniboss: true,
  });
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper function to get section of a path
  const getPathSection = (path: Path, index: number): 1 | 2 => {
    if (path.section === 1 || path.section === 2) {
      return path.section;
    }
    return index < 9 ? 1 : 2;
  };

  // Calculate BG statistics
  const calculateBgStats = () => {
    let totalDeaths = 0;
    let nodesCleared = 0;
    let totalBonus = 0;

    const pathNodeCount = pathAssignmentMode === 'single' ? 4 : 2;
    const inProgressNodeCount = pathAssignmentMode === 'single' ? 2 : 1;

    const paths = battlegroup.paths || [];
    paths.forEach(path => {
      const primaryDeaths = safeNumber(path.primaryDeaths);
      const backupDeaths = safeNumber(path.backupDeaths);
      totalDeaths += primaryDeaths + backupDeaths;
      if (path.status === 'completed') nodesCleared += pathNodeCount;
      else if (path.status === 'in-progress') nodesCleared += inProgressNodeCount;

      const pathDeaths = primaryDeaths + backupDeaths;
      totalBonus += calculatePathBonus(pathDeaths, path.noDefender, pathNodeCount);
    });

    const miniBosses = battlegroup.miniBosses || [];
    miniBosses.forEach(mb => {
      const primaryDeaths = safeNumber(mb.primaryDeaths);
      const backupDeaths = safeNumber(mb.backupDeaths);
      totalDeaths += primaryDeaths + backupDeaths;
      if (mb.status === 'completed') nodesCleared += 1;

      const mbDeaths = primaryDeaths + backupDeaths;
      totalBonus += mb.noDefender ? 0 : calculateNodeBonus(mbDeaths);
    });

    if (battlegroup.boss) {
      totalDeaths += safeNumber(battlegroup.boss.primaryDeaths) + safeNumber(battlegroup.boss.backupDeaths);
      if (battlegroup.boss.status === 'completed') {
        nodesCleared += 1;
        totalBonus += battlegroup.boss.noDefender ? 0 : calculateBossBonus(true);
      }
    }

    return { totalDeaths, nodesCleared, totalBonus };
  };

  const stats = calculateBgStats();
  const currentExploration = calculateExploration(battlegroup, pathAssignmentMode);

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

    const exploration = calculateExploration({ ...battlegroup, ...updatedBg }, pathAssignmentMode);
    onUpdate({ ...updatedBg, exploration });
  };

  // Handle mini boss updates
  const handleMiniBossUpdate = (mbId: string, updates: any) => {
    const miniBosses = battlegroup.miniBosses || [];
    const updatedMiniBosses = miniBosses.map(mb =>
      mb.id === mbId ? { ...mb, ...updates } : mb
    );
    const updatedBg = { miniBosses: updatedMiniBosses };

    const exploration = calculateExploration({ ...battlegroup, ...updatedBg }, pathAssignmentMode);
    onUpdate({ ...updatedBg, exploration });
  };

  // Handle boss updates
  const handleBossUpdate = (_bossId: string, updates: any) => {
    const updatedBg = {
      boss: {
        ...battlegroup.boss,
        ...updates,
      },
    };

    const exploration = calculateExploration({ ...battlegroup, ...updatedBg }, pathAssignmentMode);
    onUpdate({ ...updatedBg, exploration });
  };

  // Shared table header cells (8 columns). Icon headers save horizontal space on mobile.
  const tableHeaders = [
    { label: 'Path',   title: 'Path',          left: true  },
    { label: 'Player', title: 'Player',         left: true  },
    { label: 'Status', title: 'Status',         left: false },
    { label: 'Deaths', title: 'Deaths',         left: false },
    { label: '👤✕',   title: 'No-Show?',       left: false },
    { label: '🔄',    title: 'Backup Helped?', left: false },
    { label: '🚫',    title: 'No Defender?',   left: false },
    { label: 'Bonus',  title: 'Bonus',          left: false },
  ];

  // Renders the bonus cell for paths — zero if noDefender
  const pathBonusCell = (path: any) => {
    const nodeCount = pathAssignmentMode === 'single' ? 4 : 2;
    const bonus = calculatePathBonus(safeNumber(path.primaryDeaths) + safeNumber(path.backupDeaths), path.noDefender, nodeCount);
    return (
      <td className="px-3 py-2 text-center">
        <span className={`font-black text-xs ${path.noDefender ? 'text-slate-500' : 'text-yellow-300'}`}>
          {path.noDefender ? '0' : bonus.toLocaleString()}
        </span>
      </td>
    );
  };

  // Renders a path row (used in both single and split mode)
  const renderPathRow = (path: any, displayIdx: number, section: 1 | 2) => {
    const player = players.find(p => p.id === path.assignedPlayerId);
    const showSubRow = path.playerNoShow || path.backupHelped || expandedNotes[path.id];
    const rowBg = displayIdx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-700/20';
    const subRowBg = displayIdx % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-700/40';

    return (
      <React.Fragment key={path.id}>
        <tr className={rowBg}>
          <td className="px-3 py-2">
            <div className="text-white font-black text-xs">P{path.pathNumber}</div>
            <div className="flex items-center gap-1 mt-0.5">
              {pathAssignmentMode === 'split' && (
                <span className="text-[10px] text-slate-500">S{section}</span>
              )}
              <button
                onClick={() => setExpandedNotes(prev => ({ ...prev, [path.id]: !prev[path.id] }))}
                className={`text-[10px] px-1 rounded transition-colors ${expandedNotes[path.id] ? 'text-yellow-300' : 'text-slate-500 hover:text-slate-300'}`}
                title="Toggle notes"
              >📝</button>
            </div>
          </td>
          <td className="px-3 py-2 text-cyan-300 text-xs">{player?.name || '-'}</td>
          <td className="px-3 py-2 text-center">
            <button
              onClick={() => handlePathUpdate(path.id, { status: path.status === 'completed' ? 'not-started' : 'completed' })}
              className={`px-3 py-1 rounded-lg text-[10px] font-black transition-colors duration-200 ${
                path.status === 'completed' ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {path.status === 'completed' ? 'Done' : 'Pending'}
            </button>
          </td>
          <td className="px-3 py-2 text-center">
            <input
              type="number" min="0" max="6"
              value={path.primaryDeaths || 0}
              onFocus={e => e.target.select()}
              onChange={e => handlePathUpdate(path.id, { primaryDeaths: safeNumber(e.target.value) })}
              className="w-12 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 text-center focus:border-purple-500 focus:outline-none text-xs"
            />
          </td>
          <td className="px-3 py-2 text-center">
            <input type="checkbox" checked={path.playerNoShow || false}
              onChange={e => handlePathUpdate(path.id, { playerNoShow: e.target.checked })}
              className="w-4 h-4 cursor-pointer" />
          </td>
          <td className="px-3 py-2 text-center">
            <input type="checkbox" checked={path.backupHelped || false}
              onChange={e => handlePathUpdate(path.id, { backupHelped: e.target.checked })}
              className="w-4 h-4 cursor-pointer" />
          </td>
          <td className="px-3 py-2 text-center">
            <input type="checkbox" checked={!!path.noDefender}
              onChange={e => handlePathUpdate(path.id, { noDefender: e.target.checked })}
              className="w-4 h-4 cursor-pointer accent-slate-400" />
          </td>
          {pathBonusCell(path)}
        </tr>
        {showSubRow && (
          <tr className={subRowBg}>
            <td colSpan={8} className="px-3 py-2">
              <div className="flex flex-wrap gap-3 bg-slate-700/30 rounded-xl p-3">
                {path.playerNoShow && (
                  <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                    <span className="text-xs font-black text-red-300 whitespace-nowrap">Replaced by:</span>
                    <select value={path.replacedByPlayerId || ''}
                      onChange={e => handlePathUpdate(path.id, { replacedByPlayerId: e.target.value })}
                      className="flex-1 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none text-xs">
                      <option value="">- Select -</option>
                      {players.filter(p => p.bgAssignment === bgIndex && p.id !== path.assignedPlayerId).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {path.backupHelped && (
                  <>
                    <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                      <span className="text-xs font-black text-slate-300 whitespace-nowrap">Backup Player:</span>
                      <select value={path.backupPlayerId || ''}
                        onChange={e => handlePathUpdate(path.id, { backupPlayerId: e.target.value })}
                        className="flex-1 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-xs">
                        <option value="">- Select Backup -</option>
                        {players.filter(p => p.bgAssignment === bgIndex && p.id !== path.assignedPlayerId).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-300 whitespace-nowrap">Backup Fights:</span>
                      <input
                        type="number" min="1" max={pathAssignmentMode === 'single' ? 4 : 2}
                        value={path.backupFights ?? 1}
                        onFocus={e => e.target.select()}
                        onChange={e => handlePathUpdate(path.id, { backupFights: safeNumber(e.target.value) })}
                        className="w-12 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 text-center focus:border-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-300">Deaths:</span>
                      <input type="number" min="0" max="6" value={path.backupDeaths || 0} onFocus={e => e.target.select()}
                        onChange={e => handlePathUpdate(path.id, { backupDeaths: safeNumber(e.target.value) })}
                        className="w-12 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 text-center focus:border-blue-500 focus:outline-none text-xs" />
                    </div>
                  </>
                )}
                {expandedNotes[path.id] && (
                  <div className="w-full">
                    <textarea value={path.notes || ''}
                      onChange={e => handlePathUpdate(path.id, { notes: e.target.value })}
                      placeholder="Notes..."
                      className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-purple-500 focus:outline-none text-xs resize-none"
                      rows={2} />
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="sticky top-0 z-10 flex gap-2 bg-slate-900/95 backdrop-blur-sm px-1 py-2 rounded-xl border border-slate-700/50">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors duration-200 ${
            activeTab === 'summary'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          📊 Summary
        </button>
        <button
          onClick={() => setActiveTab('recording')}
          className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors duration-200 ${
            activeTab === 'recording'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          ⚔️ Recording
        </button>
      </div>

      {/* ── Summary Tab ── */}
      {activeTab === 'summary' && (
        <div className="bg-slate-800/60 rounded-xl p-4 border border-purple-500/30 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
            BG{battlegroup.bgNumber} Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Nodes Cleared</div>
              <div className="text-2xl font-black text-white">{stats.nodesCleared || 0}/50</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Exploration</div>
              <div className="text-2xl font-black text-cyan-400">{currentExploration || 0}%</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Total Deaths</div>
              <div className="text-2xl font-black text-red-400">{stats.totalDeaths || 0}</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Attack Bonus</div>
              <div className="text-2xl font-black text-yellow-400">{(stats.totalBonus || 0).toLocaleString()}</div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Players Active</div>
              <div className="text-2xl font-black text-blue-400">{assignedPlayers.size || 0}</div>
            </div>
          </div>
          <div className="text-center text-[10px] text-slate-500 font-medium">
            Max Attack Bonus: 72,950 (18 paths × 1,080 + 13 MBs × 270 + 1 boss × 50,000)
          </div>
        </div>
      )}

      {/* ── Recording Tab ── */}
      {activeTab === 'recording' && (
        <div className="space-y-6">
          {pathAssignmentMode === 'single' ? (
            /* ── Single-path mode ── */
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => toggleSection('section1')}
                className="w-full px-4 py-3 bg-slate-800/80 hover:bg-slate-700/80 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300">Paths 1-9</span>
                <div className="flex items-center gap-2">
                  <span className="bg-cyan-700 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                    {(battlegroup.paths || []).filter((p, idx) => getPathSection(p, idx) === 1 && p.status === 'completed').length}/9
                  </span>
                  <span className={`text-slate-400 transform transition-transform text-xs ${expandedSections.section1 ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>

              {expandedSections.section1 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/50">
                      <tr>
                        {tableHeaders.map(h => (
                          <th key={h.label} title={h.title} className={`px-3 py-2 text-slate-200 text-[10px] font-black uppercase tracking-wider ${h.left ? 'text-left' : 'text-center'}`}>{h.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(battlegroup.paths || []).map((path, pathIndex) => {
                        if (getPathSection(path, pathIndex) !== 1) return null;
                        const displayIdx = (battlegroup.paths || []).filter((p, idx) => getPathSection(p, idx) === 1).indexOf(path);
                        return renderPathRow(path, displayIdx, 1);
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ── Split mode ── */
            <>
              {/* War Section 1 */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => toggleSection('section1')}
                  className="w-full px-4 py-3 bg-slate-800/80 hover:bg-slate-700/80 transition-colors duration-200 flex items-center justify-between"
                >
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300">War Section 1 (Paths 1-9)</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                      {(battlegroup.paths || []).filter((p, idx) => getPathSection(p, idx) === 1 && p.status === 'completed').length}/9
                    </span>
                    <span className={`text-slate-400 transform transition-transform text-xs ${expandedSections.section1 ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {expandedSections.section1 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          {tableHeaders.map(h => (
                            <th key={h.label} title={h.title} className={`px-3 py-2 text-slate-200 text-[10px] font-black uppercase tracking-wider ${h.left ? 'text-left' : 'text-center'}`}>{h.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(battlegroup.paths || []).map((path, pathIndex) => {
                          if (getPathSection(path, pathIndex) !== 1) return null;
                          const displayIdx = (battlegroup.paths || []).filter((p, idx) => getPathSection(p, idx) === 1).indexOf(path);
                          return renderPathRow(path, displayIdx, 1);
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* War Section 2 */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => toggleSection('section2')}
                  className="w-full px-4 py-3 bg-slate-800/80 hover:bg-slate-700/80 transition-colors duration-200 flex items-center justify-between"
                >
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300">War Section 2 (Paths 1-9)</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                      {(battlegroup.paths || []).filter((p, idx) => getPathSection(p, idx) === 2 && p.status === 'completed').length}/9
                    </span>
                    <span className={`text-slate-400 transform transition-transform text-xs ${expandedSections.section2 ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {expandedSections.section2 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          {tableHeaders.map(h => (
                            <th key={h.label} title={h.title} className={`px-3 py-2 text-slate-200 text-[10px] font-black uppercase tracking-wider ${h.left ? 'text-left' : 'text-center'}`}>{h.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(battlegroup.paths || []).map((path, pathIndex) => {
                          if (getPathSection(path, pathIndex) !== 2) return null;
                          const displayIdx = (battlegroup.paths || []).filter((p, idx) => getPathSection(p, idx) === 2).indexOf(path);
                          return renderPathRow(path, displayIdx, 2);
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mini Bosses & Final Boss Section */}
          {battlegroup.miniBosses && battlegroup.miniBosses.length > 0 ? (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => toggleSection('miniboss')}
                className="sticky top-11 z-10 w-full px-4 py-3 bg-slate-800/95 hover:bg-slate-700/95 backdrop-blur-sm transition-colors duration-200 flex items-center justify-between"
              >
                <span className="text-xs font-black uppercase tracking-wider text-red-300">Mini Bosses (Nodes 37-49) &amp; Final Boss (Node 50)</span>
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                    {battlegroup.miniBosses.filter(mb => mb.status === 'completed').length}/13 + {battlegroup.boss?.status === 'completed' ? '1' : '0'}/1
                  </span>
                  <span className={`text-slate-400 transform transition-transform text-xs ${expandedSections.miniboss ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>

              {expandedSections.miniboss && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[580px]">
                    <thead className="bg-red-900/40">
                      <tr>
                        {[
                          { label: 'Node',   title: 'Node',            left: true  },
                          { label: 'Player', title: 'Player',          left: true  },
                          { label: 'Status', title: 'Status',          left: false },
                          { label: 'Deaths', title: 'Deaths',          left: false },
                          { label: '👤✕',   title: 'No-Show?',        left: false },
                          { label: '🔄',    title: 'Backup Helped?',  left: false },
                          { label: '🚫',    title: 'No Defender?',    left: false },
                          { label: 'Bonus',  title: 'Bonus',           left: false },
                        ].map(h => (
                          <th key={h.label} title={h.title} className={`px-3 py-2 text-red-200 text-[10px] font-black uppercase tracking-wider ${h.left ? 'text-left' : 'text-center'}`}>{h.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {battlegroup.miniBosses.map((mb, mbIndex) => {
                        const mbBgPlayers = players.filter(p => p.bgAssignment === bgIndex);
                        const totalMbDeaths = safeNumber(mb.primaryDeaths) + safeNumber(mb.backupDeaths);
                        const mbBonus = mb.noDefender ? 0 : calculateNodeBonus(totalMbDeaths);
                        const showMbSubRow = mb.playerNoShow || mb.backupHelped || expandedNotes[mb.id];

                        return (
                          <React.Fragment key={mb.id}>
                            <tr className={mbIndex % 2 === 0 ? 'bg-red-950/20' : 'bg-red-900/10'}>
                              <td className="px-2 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <span className="text-white font-black text-xs">{mb.name}</span>
                                  <span className="text-[9px] text-red-400/70">·{mb.nodeNumber}</span>
                                  <button
                                    onClick={() => setExpandedNotes(prev => ({ ...prev, [mb.id]: !prev[mb.id] }))}
                                    className={`text-[10px] px-0.5 rounded transition-colors ${expandedNotes[mb.id] ? 'text-yellow-300' : 'text-slate-500 hover:text-slate-300'}`}
                                    title="Toggle notes"
                                  >📝</button>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={mb.assignedPlayerId || ''}
                                  onChange={e => handleMiniBossUpdate(mb.id, { assignedPlayerId: e.target.value })}
                                  className="w-full px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none text-xs"
                                >
                                  <option value="">- Player -</option>
                                  {mbBgPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => handleMiniBossUpdate(mb.id, { status: mb.status === 'completed' ? 'not-started' : 'completed' })}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black transition-colors duration-200 ${
                                    mb.status === 'completed' ? 'bg-green-600 text-white' :
                                    mb.status === 'in-progress' ? 'bg-yellow-600 text-white' :
                                    'bg-slate-600 text-slate-300 hover:bg-slate-500'
                                  }`}
                                >
                                  {mb.status === 'completed' ? 'Done' : mb.status === 'in-progress' ? 'In Prog' : 'Pending'}
                                </button>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number" min="0" max="3"
                                  value={safeNumber(mb.primaryDeaths)}
                                  onFocus={e => e.target.select()}
                                  onChange={e => handleMiniBossUpdate(mb.id, { primaryDeaths: safeNumber(e.target.value) })}
                                  className="w-12 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 text-center focus:border-blue-500 focus:outline-none text-xs"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={!!mb.playerNoShow}
                                  onChange={e => handleMiniBossUpdate(mb.id, { playerNoShow: e.target.checked })}
                                  className="w-4 h-4 cursor-pointer" />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={!!mb.backupHelped}
                                  onChange={e => handleMiniBossUpdate(mb.id, { backupHelped: e.target.checked })}
                                  className="w-4 h-4 cursor-pointer" />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={!!mb.noDefender}
                                  onChange={e => handleMiniBossUpdate(mb.id, { noDefender: e.target.checked })}
                                  className="w-4 h-4 cursor-pointer accent-slate-400" />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`font-black text-xs ${mb.noDefender ? 'text-slate-500' : 'text-yellow-300'}`}>
                                  {mbBonus}
                                </span>
                              </td>
                            </tr>
                            {showMbSubRow && (
                              <tr className={mbIndex % 2 === 0 ? 'bg-red-950/30' : 'bg-red-900/20'}>
                                <td colSpan={8} className="px-3 py-2">
                                  <div className="flex flex-wrap gap-3 bg-slate-700/30 rounded-xl p-3">
                                    {mb.playerNoShow && (
                                      <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                                        <span className="text-xs font-black text-red-300 whitespace-nowrap">Replaced by:</span>
                                        <select
                                          value={mb.replacedByPlayerId || ''}
                                          onChange={e => handleMiniBossUpdate(mb.id, { replacedByPlayerId: e.target.value })}
                                          className="flex-1 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none text-xs"
                                        >
                                          <option value="">- Select -</option>
                                          {players.filter(p => p.bgAssignment === bgIndex && p.id !== mb.assignedPlayerId).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                    {mb.backupHelped && (
                                      <>
                                        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                                          <span className="text-xs font-black text-slate-300 whitespace-nowrap">Backup:</span>
                                          <select
                                            value={mb.backupPlayerId || ''}
                                            onChange={e => handleMiniBossUpdate(mb.id, { backupPlayerId: e.target.value })}
                                            className="flex-1 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none text-xs"
                                          >
                                            <option value="">- Select -</option>
                                            {players.filter(p => p.bgAssignment === bgIndex && p.id !== mb.assignedPlayerId).map(p => (
                                              <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-black text-slate-300 whitespace-nowrap">Backup Deaths:</span>
                                          <input
                                            type="number" min="0" max="3"
                                            value={safeNumber(mb.backupDeaths)}
                                            onFocus={e => e.target.select()}
                                            onChange={e => handleMiniBossUpdate(mb.id, { backupDeaths: safeNumber(e.target.value) })}
                                            className="w-12 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 text-center focus:border-red-500 focus:outline-none text-xs"
                                          />
                                        </div>
                                      </>
                                    )}
                                    <div className="w-full">
                                      <textarea
                                        value={mb.notes || ''}
                                        onChange={e => handleMiniBossUpdate(mb.id, { notes: e.target.value })}
                                        placeholder="Notes..."
                                        className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-red-500 focus:outline-none text-xs resize-none"
                                        rows={2}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* Final Boss Row */}
                      {battlegroup.boss && (() => {
                        const boss = battlegroup.boss;
                        const bgPlayers = players.filter(p => p.bgAssignment === bgIndex);
                        const showBossSubRow = boss.playerNoShow || boss.backupHelped || expandedNotes['boss'];
                        const bossBonus = boss.status === 'completed' ? (boss.noDefender ? 0 : 50000) : null;

                        return (
                          <React.Fragment key="boss">
                            <tr className="bg-red-900/20 border-t-2 border-red-500/40">
                              <td className="px-3 py-2">
                                <div className="text-red-300 font-black text-xs">{boss.name}</div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] text-red-400/70">Node {boss.nodeNumber}</span>
                                  <button
                                    onClick={() => setExpandedNotes(prev => ({ ...prev, boss: !prev['boss'] }))}
                                    className={`text-[10px] px-1 rounded transition-colors ${expandedNotes['boss'] ? 'text-yellow-300' : 'text-slate-500 hover:text-slate-300'}`}
                                    title="Toggle notes"
                                  >📝</button>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={boss.assignedPlayerId || ''}
                                  onChange={e => handleBossUpdate(boss.id, { assignedPlayerId: e.target.value })}
                                  className="w-full px-2 py-1 bg-slate-700 text-white rounded-lg border border-red-600/50 focus:border-red-400 focus:outline-none text-xs"
                                >
                                  <option value="">- Player -</option>
                                  {bgPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => handleBossUpdate(boss.id, { status: boss.status === 'completed' ? 'not-started' : 'completed' })}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black transition-colors duration-200 ${
                                    boss.status === 'completed' ? 'bg-green-600 text-white' :
                                    boss.status === 'in-progress' ? 'bg-yellow-600 text-white' :
                                    'bg-slate-600 text-slate-300 hover:bg-slate-500'
                                  }`}
                                >
                                  {boss.status === 'completed' ? 'Done' : boss.status === 'in-progress' ? 'In Prog' : 'Pending'}
                                </button>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number" min="0" max="3"
                                  value={safeNumber(boss.primaryDeaths)}
                                  onFocus={e => e.target.select()}
                                  onChange={e => handleBossUpdate(boss.id, { primaryDeaths: safeNumber(e.target.value) })}
                                  className="w-12 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 text-center focus:border-red-500 focus:outline-none text-xs"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={!!boss.playerNoShow}
                                  onChange={e => handleBossUpdate(boss.id, { playerNoShow: e.target.checked })}
                                  className="w-4 h-4 cursor-pointer" />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={!!boss.backupHelped}
                                  onChange={e => handleBossUpdate(boss.id, { backupHelped: e.target.checked })}
                                  className="w-4 h-4 cursor-pointer" />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={!!boss.noDefender}
                                  onChange={e => handleBossUpdate(boss.id, { noDefender: e.target.checked })}
                                  className="w-4 h-4 cursor-pointer accent-slate-400" />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`font-black text-xs ${bossBonus === null ? 'text-slate-500' : boss.noDefender ? 'text-slate-500' : 'text-yellow-300'}`}>
                                  {bossBonus === null ? '-' : boss.noDefender ? '0' : '50,000'}
                                </span>
                              </td>
                            </tr>
                            {showBossSubRow && (
                              <tr className="bg-red-900/30">
                                <td colSpan={8} className="px-3 py-2">
                                  <div className="flex flex-wrap gap-3 bg-slate-700/30 rounded-xl p-3">
                                    {boss.playerNoShow && (
                                      <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                                        <span className="text-xs font-black text-red-300 whitespace-nowrap">Replaced by:</span>
                                        <select
                                          value={boss.replacedByPlayerId || ''}
                                          onChange={e => handleBossUpdate(boss.id, { replacedByPlayerId: e.target.value })}
                                          className="flex-1 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none text-xs"
                                        >
                                          <option value="">- Select -</option>
                                          {players.filter(p => p.bgAssignment === bgIndex && p.id !== boss.assignedPlayerId).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                    {boss.backupHelped && (
                                      <>
                                        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                                          <span className="text-xs font-black text-slate-300 whitespace-nowrap">Backup:</span>
                                          <select
                                            value={boss.backupPlayerId || ''}
                                            onChange={e => handleBossUpdate(boss.id, { backupPlayerId: e.target.value })}
                                            className="flex-1 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-xs"
                                          >
                                            <option value="">- Select -</option>
                                            {players.filter(p => p.bgAssignment === bgIndex && p.id !== boss.assignedPlayerId).map(p => (
                                              <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-black text-slate-300 whitespace-nowrap">Backup Deaths:</span>
                                          <input
                                            type="number" min="0" max="3"
                                            value={safeNumber(boss.backupDeaths)}
                                            onFocus={e => e.target.select()}
                                            onChange={e => handleBossUpdate(boss.id, { backupDeaths: safeNumber(e.target.value) })}
                                            className="w-12 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 text-center focus:border-blue-500 focus:outline-none text-xs"
                                          />
                                        </div>
                                      </>
                                    )}
                                    <div className="w-full">
                                      <textarea
                                        value={boss.notes || ''}
                                        onChange={e => handleBossUpdate(boss.id, { notes: e.target.value })}
                                        placeholder="Notes..."
                                        className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-red-500 focus:outline-none text-xs resize-none"
                                        rows={2}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 text-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-yellow-300 mb-2">⚠️ Old War Format</h3>
              <p className="text-slate-300 text-sm mb-4">
                This war was created before V2.5 Enhanced and doesn't have mini boss tracking.
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Create a new war to use the V2.5 features (path-level assignments, backup tracking, mini bosses, etc.)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
