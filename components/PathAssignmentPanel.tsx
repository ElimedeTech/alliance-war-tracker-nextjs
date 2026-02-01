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

  // Get paths for a specific section
  const getPathsForSection = (section: 1 | 2): Path[] => {
    return battlegroup.paths.filter(p => {
      // Handle paths that might not have section property by inferring from index
      const pathSection = p.section || (battlegroup.paths.indexOf(p) < 9 ? 1 : 2);
      return pathSection === section;
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

    // Get the section, inferring from position if not set
    const pathIndex = updatedWar.battlegroups[bgIndex].paths.indexOf(path);
    const pathSection = path.section || (pathIndex < 9 ? 1 : 2);

    // If the same player is already assigned, unassign them
    if (path.assignedPlayerId === playerId) {
      path.assignedPlayerId = '';
    } else {
      // Check if player is already assigned to another path in the same section
      const conflictingPath = updatedWar.battlegroups[bgIndex].paths.find(
        p => {
          const pSection = p.section || (updatedWar.battlegroups[bgIndex].paths.indexOf(p) < 9 ? 1 : 2);
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

  const bgPlayers = battlegroup.players?.length || 0;
  const bgPlayerIds = new Set(battlegroup.players || []);
  const availablePlayers = players.filter(p => bgPlayerIds.has(p.id));

  const renderSection = (title: string, pathObjects: any[], sectionKey: string, isPath: boolean = true) => {
    const isExpanded = expandedSection === sectionKey;

    return (
      <div key={sectionKey} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition text-left"
        >
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{pathObjects.length} items</span>
            <span className={`text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 border-t border-gray-700 space-y-3">
            {pathObjects.length === 0 ? (
              <p className="text-gray-500 text-center text-sm py-4">No items to assign</p>
            ) : (
              pathObjects.map((item) => (
                <div key={item.id} className="p-3 bg-gray-700/50 rounded border border-gray-600 hover:border-gray-500 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">
                      {isPath ? `Path ${item.pathNumber}` : `Node ${item.nodeNumber}`}
                    </span>
                    {item.assignedPlayerId && (
                      <span className="text-xs bg-purple-600/80 text-white px-2 py-1 rounded">
                        {getPlayerName(item.assignedPlayerId)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                        className={`px-2 py-1 rounded text-xs font-semibold transition ${
                          item.assignedPlayerId === player.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
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
        <h2 className="text-2xl font-bold text-white mb-2">Path & Node Assignment</h2>
        <p className="text-gray-400 text-sm">
          BG{bgIndex + 1} • {availablePlayers.length} players assigned
        </p>
      </div>

      {renderSection('War Section 1 (Paths 1-9)', getPathsForSection(1), 'section1', true)}
      {renderSection('War Section 2 (Paths 1-9)', getPathsForSection(2), 'section2', true)}
      {renderSection('Mini Bosses (Nodes 37-49)', battlegroup.miniBosses, 'miniboss', false)}
      {renderSection('Boss Island (Node 50)', [battlegroup.boss], 'boss', false)}
    </div>
  );
}
