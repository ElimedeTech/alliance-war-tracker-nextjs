'use client';

import { useState } from 'react';
import { War, Player, Path } from '@/types';

interface PathAssignmentPanelProps {
  war: War;
  bgIndex: number; // 0-2 for BG1-3
  players: Player[];
  onUpdateWar: (war: War) => void;
}

export default function PathAssignmentPanel({
  war,
  bgIndex,
  players,
  onUpdateWar,
}: PathAssignmentPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('section1');

  const battlegroup = war.battlegroups[bgIndex];
  if (!battlegroup) return null;

  // Helper function to get section of a path
  const getPathSection = (path: Path, index: number): 1 | 2 => {
    if (path.section === 1 || path.section === 2) {
      return path.section;
    }
    return index < 9 ? 1 : 2;
  };

  // Get paths for a specific section
  const getPathsForSection = (section: 1 | 2): Path[] => {
    return (battlegroup.paths || []).filter((p, idx) => {
      return getPathSection(p, idx) === section;
    });
  };

  // Get player name by ID
  const getPlayerName = (playerId: string): string => {
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  // Handle path assignment
  const handleAssignPath = (pathId: string, playerId: string) => {
    const updatedWar = { ...war };
    const path = updatedWar.battlegroups[bgIndex].paths.find(p => p.id === pathId);

    if (!path) return;

    const pathIndex = updatedWar.battlegroups[bgIndex].paths.indexOf(path);
    const pathSection = getPathSection(path, pathIndex);

    if (path.assignedPlayerId === playerId) {
      path.assignedPlayerId = '';
    } else {
      const conflictingPath = updatedWar.battlegroups[bgIndex].paths.find(
        (p, idx) => {
          const pSection = getPathSection(p, idx);
          return pSection === pathSection && p.assignedPlayerId === playerId && p.id !== pathId;
        }
      );

      if (conflictingPath) {
        alert(
          `${getPlayerName(playerId)} is already assigned to Path ${conflictingPath.pathNumber} in Section ${pathSection}.\n\nEach player can only have one path per section.`
        );
        return;
      }

      path.assignedPlayerId = playerId;
    }

    onUpdateWar(updatedWar);
  };

  // Handle mini boss assignment
  const handleAssignMiniBoss = (miniBossId: string, playerId: string) => {
    const updatedWar = { ...war };
    const miniBoss = updatedWar.battlegroups[bgIndex].miniBosses.find(m => m.id === miniBossId);

    if (!miniBoss) return;

    if (miniBoss.assignedPlayerId === playerId) {
      miniBoss.assignedPlayerId = '';
    } else {
      miniBoss.assignedPlayerId = playerId;
    }

    onUpdateWar(updatedWar);
  };

  // Handle boss assignment
  const handleAssignBoss = (playerId: string) => {
    const updatedWar = { ...war };
    const boss = updatedWar.battlegroups[bgIndex].boss;

    if (boss.assignedPlayerId === playerId) {
      boss.assignedPlayerId = '';
    } else {
      boss.assignedPlayerId = playerId;
    }

    onUpdateWar(updatedWar);
  };

  const bgPlayerIds = new Set(battlegroup.players || []);
  const availablePlayers = players.filter(p => bgPlayerIds.has(p.id));

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
              pathObjects.map((item) => (
                <div key={item.id} className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-white text-xs uppercase tracking-wider">
                      {isPath ? `Path ${item.pathNumber}` : `Node ${item.nodeNumber}`}
                    </span>
                    {item.assignedPlayerId && (
                      <span className="text-[10px] bg-purple-600/80 text-white px-2 py-0.5 rounded-lg font-semibold">
                        {getPlayerName(item.assignedPlayerId)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {availablePlayers.map(player => (
                      <button
                        key={player.id}
                        onClick={() =>
                          isPath
                            ? handleAssignPath(item.id, player.id)
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

  return (
    <div className="space-y-4 p-6">
      <div className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-1">Path & Node Assignment</h2>
        <p className="text-slate-400 text-xs font-medium">
          BG{bgIndex + 1} · {availablePlayers.length} players assigned
        </p>
      </div>

      {renderSection('War Section 1 (Paths 1-9)', getPathsForSection(1), 'section1', true)}
      {renderSection('War Section 2 (Paths 1-9)', getPathsForSection(2), 'section2', true)}
      {renderSection('Mini Bosses (Nodes 37-49)', battlegroup.miniBosses, 'miniboss', false)}
      {renderSection('Boss Island (Node 50)', [battlegroup.boss], 'boss', false)}
    </div>
  );
}
