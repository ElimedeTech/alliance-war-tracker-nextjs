'use client';

import { useState } from 'react';
import { War, Player, Path } from '@/types';

interface PathAssignmentPanelProps {
  war: War;
  bgIndex: number; // 0-2 for BG1-3
  players: Player[];
  pathAssignmentMode?: 'split' | 'single';
  onUpdateWar: (war: War) => void;
}

export default function PathAssignmentPanel({
  war,
  bgIndex,
  players,
  pathAssignmentMode = 'split',
  onUpdateWar,
}: PathAssignmentPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('section1');

  const battlegroup = war.battlegroups[bgIndex];
  if (!battlegroup) return null;

  // Helper: determine section of a path by its section field or index
  const getPathSection = (path: Path, index: number): 1 | 2 => {
    if (path.section === 1 || path.section === 2) return path.section;
    return index < 9 ? 1 : 2;
  };

  // Get paths for a specific section (split mode)
  const getPathsForSection = (section: 1 | 2): Path[] =>
    (battlegroup.paths || []).filter((p, idx) => getPathSection(p, idx) === section);

  // Build merged path list for single mode: one entry per path number 1-9
  // Uses section 1 path as the "primary" display object; assignment writes to both sections
  const getMergedPaths = (): { pathNumber: number; sec1: Path; sec2: Path }[] => {
    const sec1Paths = getPathsForSection(1);
    const sec2Paths = getPathsForSection(2);
    return Array.from({ length: 9 }, (_, i) => {
      const pathNum = i + 1;
      const sec1 = sec1Paths.find(p => p.pathNumber === pathNum) ?? sec1Paths[i];
      const sec2 = sec2Paths.find(p => p.pathNumber === pathNum) ?? sec2Paths[i];
      return { pathNumber: pathNum, sec1, sec2 };
    }).filter(m => m.sec1 && m.sec2);
  };

  // Updated resolver: checks live/archived roster first, then falls back to
  // the name snapshot baked into the record, then 'Unknown Player'
  const getPlayerName = (playerId: string, snapshotName?: string): string =>
    players.find(p => p.id === playerId)?.name
    ?? snapshotName
    ?? 'Unknown Player';

  // ── Split-mode assignment ────────────────────────────────────────────────────
  const handleAssignPathSplit = (pathId: string, playerId: string) => {
    const updatedWar = { ...war };
    const paths = updatedWar.battlegroups[bgIndex].paths;
    const path = paths.find(p => p.id === pathId);
    if (!path) return;

    const pathIndex = paths.indexOf(path);
    const pathSection = getPathSection(path, pathIndex);

    if (path.assignedPlayerId === playerId) {
      // Toggle off — clear both id and name snapshot
      path.assignedPlayerId = '';
      path.assignedPlayerName = '';
    } else {
      const conflict = paths.find((p, idx) => {
        const pSection = getPathSection(p, idx);
        return pSection === pathSection && p.assignedPlayerId === playerId && p.id !== pathId;
      });
      if (conflict) {
        alert(
          `${getPlayerName(playerId)} is already assigned to Path ${conflict.pathNumber} in Section ${pathSection}.\n\nEach player can only have one path per section.`
        );
        return;
      }
      // Assign — snapshot the name alongside the id
      path.assignedPlayerId = playerId;
      path.assignedPlayerName = players.find(p => p.id === playerId)?.name ?? '';
    }
    onUpdateWar(updatedWar);
  };

  // ── Single-mode assignment ────────────────────────────────────────────────────
  // Assigns (or clears) the player on BOTH section 1 and section 2 of the path number
  const handleAssignPathSingle = (pathNumber: number, playerId: string) => {
    const updatedWar = { ...war };
    const paths = updatedWar.battlegroups[bgIndex].paths;

    const sec1Path = paths.find((p, idx) => p.pathNumber === pathNumber && getPathSection(p, idx) === 1);
    const sec2Path = paths.find((p, idx) => p.pathNumber === pathNumber && getPathSection(p, idx) === 2);

    const currentAssignee = sec1Path?.assignedPlayerId ?? '';

    if (currentAssignee === playerId) {
      // Toggle off — clear both sections including name snapshots
      if (sec1Path) { sec1Path.assignedPlayerId = ''; sec1Path.assignedPlayerName = ''; }
      if (sec2Path) { sec2Path.assignedPlayerId = ''; sec2Path.assignedPlayerName = ''; }
    } else {
      // Check if this player is already on a different path number (either section)
      const conflict = paths.find(
        (p, idx) =>
          p.assignedPlayerId === playerId &&
          p.pathNumber !== pathNumber &&
          (getPathSection(p, idx) === 1 || getPathSection(p, idx) === 2)
      );
      if (conflict) {
        alert(
          `${getPlayerName(playerId)} is already assigned to Path ${conflict.pathNumber}.\n\nEach player can only have one path.`
        );
        return;
      }
      // Assign — snapshot the name on both sections
      const playerName = players.find(p => p.id === playerId)?.name ?? '';
      if (sec1Path) { sec1Path.assignedPlayerId = playerId; sec1Path.assignedPlayerName = playerName; }
      if (sec2Path) { sec2Path.assignedPlayerId = playerId; sec2Path.assignedPlayerName = playerName; }
    }
    onUpdateWar(updatedWar);
  };

  // ── Mini boss & boss ─────────────────────────────────────────────────────────
  const handleAssignMiniBoss = (miniBossId: string, playerId: string) => {
    const updatedWar = { ...war };
    const miniBoss = updatedWar.battlegroups[bgIndex].miniBosses.find(m => m.id === miniBossId);
    if (!miniBoss) return;

    if (miniBoss.assignedPlayerId === playerId) {
      // Toggle off — clear both id and name snapshot
      miniBoss.assignedPlayerId = '';
      miniBoss.assignedPlayerName = '';
    } else {
      // Assign — snapshot the name alongside the id
      miniBoss.assignedPlayerId = playerId;
      miniBoss.assignedPlayerName = players.find(p => p.id === playerId)?.name ?? '';
    }
    onUpdateWar(updatedWar);
  };

  const handleAssignBoss = (playerId: string) => {
    const updatedWar = { ...war };
    const boss = updatedWar.battlegroups[bgIndex].boss;

    if (boss.assignedPlayerId === playerId) {
      // Toggle off — clear both id and name snapshot
      boss.assignedPlayerId = '';
      boss.assignedPlayerName = '';
    } else {
      // Assign — snapshot the name alongside the id
      boss.assignedPlayerId = playerId;
      boss.assignedPlayerName = players.find(p => p.id === playerId)?.name ?? '';
    }
    onUpdateWar(updatedWar);
  };

  const availablePlayers = players.filter(p => p.bgAssignment === bgIndex);

  // ── Generic collapsible section renderer ────────────────────────────────────
  const renderSection = (title: string, pathObjects: any[], sectionKey: string, isPath: boolean = true) => {
    const isExpanded = expandedSection === sectionKey;

    return (
      <div key={sectionKey} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors duration-200 text-left"
        >
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">{pathObjects.length} items</span>
            <span className={`text-slate-400 transform transition-transform text-xs ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 border-t border-slate-700 space-y-3">
            {pathObjects.length === 0 ? (
              <p className="text-slate-500 text-center text-xs py-4">No items to assign</p>
            ) : (
              pathObjects.map((item: any) => (
                <div key={item.id} className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-white text-xs uppercase tracking-wider">
                      {isPath ? `Path ${item.pathNumber}` : `Node ${item.nodeNumber}`}
                    </span>
                    {item.assignedPlayerId && (
                      <span className="text-[10px] bg-purple-600/80 text-white px-2 py-0.5 rounded-lg font-semibold">
                        {/* Pass assignedPlayerName as snapshot fallback */}
                        {getPlayerName(item.assignedPlayerId, item.assignedPlayerName)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availablePlayers.map(player => (
                      <button
                        key={player.id}
                        onClick={() =>
                          isPath
                            ? handleAssignPathSplit(item.id, player.id)
                            : sectionKey === 'boss'
                            ? handleAssignBoss(player.id)
                            : handleAssignMiniBoss(item.id, player.id)
                        }
                        className={`px-2 py-1 rounded-lg text-xs font-black transition-colors duration-200 ${
                          item.assignedPlayerId === player.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        {player.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Single-mode path section renderer ────────────────────────────────────────
  const renderSinglePaths = () => {
    const mergedPaths = getMergedPaths();
    const isExpanded = expandedSection === 'paths';

    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : 'paths')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors duration-200 text-left"
        >
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Paths 1–9 (Both Sections)</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">{mergedPaths.length} paths · 4 fights each</span>
            <span className={`text-slate-400 transform transition-transform text-xs ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 border-t border-slate-700 space-y-3">
            {mergedPaths.map(({ pathNumber, sec1 }) => {
              const assignedId = sec1.assignedPlayerId;
              return (
                <div key={pathNumber} className="p3 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-white text-xs uppercase tracking-wider">
                      Path {pathNumber}
                      <span className="ml-2 text-[10px] text-cyan-400 font-semibold normal-case tracking-normal">Sec 1 + Sec 2</span>
                    </span>
                    {assignedId && (
                      <span className="text-[10px] bg-cyan-600/80 text-white px-2 py-0.5 rounded-lg font-semibold">
                        {/* Pass sec1.assignedPlayerName as snapshot fallback */}
                        {getPlayerName(assignedId, sec1.assignedPlayerName)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availablePlayers.map(player => (
                      <button
                        key={player.id}
                        onClick={() => handleAssignPathSingle(pathNumber, player.id)}
                        className={`px-2 py-1 rounded-lg text-xs font-black transition-colors duration-200 ${
                          assignedId === player.id
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        {player.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-6">
      <div className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-1">Path & Node Assignment</h2>
        <p className="text-slate-400 text-xs font-medium">
          BG{bgIndex + 1} · {availablePlayers.length} players · Mode:{' '}
          <span className={pathAssignmentMode === 'single' ? 'text-cyan-400' : 'text-purple-400'}>
            {pathAssignmentMode === 'single' ? 'Single Path (4 fights/path)' : 'Split Sections (2 fights/section)'}
          </span>
        </p>
      </div>

      {pathAssignmentMode === 'single' ? (
        <>
          {renderSinglePaths()}
          {renderSection('Mini Bosses (Nodes 37-49)', battlegroup.miniBosses, 'miniboss', false)}
          {renderSection('Boss Island (Node 50)', [battlegroup.boss], 'boss', false)}
        </>
      ) : (
        <>
          {renderSection('War Section 1 (Paths 1-9)', getPathsForSection(1), 'section1', true)}
          {renderSection('War Section 2 (Paths 1-9)', getPathsForSection(2), 'section2', true)}
          {renderSection('Mini Bosses (Nodes 37-49)', battlegroup.miniBosses, 'miniboss', false)}
          {renderSection('Boss Island (Node 50)', [battlegroup.boss], 'boss', false)}
        </>
      )}
    </div>
  );
}