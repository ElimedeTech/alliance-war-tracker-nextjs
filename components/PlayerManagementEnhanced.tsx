'use client';

import { useState } from 'react';
import { Player } from '@/types';

interface PlayerManagementEnhancedProps {
  players: Player[];
  onClose: () => void;
  onUpdatePlayers: (players: Player[]) => void;
}

export default function PlayerManagementEnhanced({ players, onClose, onUpdatePlayers }: PlayerManagementEnhancedProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBg, setFilterBg] = useState<number | 'all' | 'unassigned'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'bg' | 'pathFights' | 'mbFights' | 'deaths'>('name');

  const addPlayer = () => {
    if (!newPlayerName.trim()) {
      alert('Please enter a player name!');
      return;
    }

    if (players.some(p => p.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
      alert('A player with this name already exists!');
      return;
    }

    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random()}`,
      name: newPlayerName.trim(),
      bgAssignment: -1,
      pathFights: 0,
      mbFights: 0,
      totalDeaths: 0,
      warsParticipated: 0,
    };

    onUpdatePlayers([...players, newPlayer]);
    setNewPlayerName('');
  };

  const removePlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (confirm(`⚠️ Remove ${player?.name}?\n\nThis cannot be undone!`)) {
      onUpdatePlayers(players.filter(p => p.id !== playerId));
    }
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    onUpdatePlayers(players.map(p => p.id === playerId ? { ...p, ...updates } : p));
  };

  const transferPlayerToBG = (playerId: string, newBg: number | -1) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Check BG capacity if assigning (10 per BG)
    if (newBg !== -1) {
      const bgCount = players.filter(p => p.bgAssignment === newBg && p.id !== playerId).length;
      if (bgCount >= 10) {
        alert(`⚠️ BG${newBg + 1} is full! (10/10 players)\n\nRemove a player from BG${newBg + 1} first or choose another BG.`);
        return;
      }
    }

    const confirmMsg = newBg === -1
      ? `Remove ${player.name} from BG${player.bgAssignment + 1}?`
      : player.bgAssignment === -1
      ? `Assign ${player.name} to BG${newBg + 1}?`
      : `Transfer ${player.name} from BG${player.bgAssignment + 1} to BG${newBg + 1}?`;

    if (confirm(confirmMsg)) {
      updatePlayer(playerId, { bgAssignment: newBg });
    }
  };

  const bulkAssignToBG = (bg: number) => {
    const unassigned = players.filter(p => p.bgAssignment === -1);
    const bgCount = players.filter(p => p.bgAssignment === bg).length;
    const available = 10 - bgCount;

    if (available <= 0) {
      alert(`BG${bg + 1} is full! (10/10)`);
      return;
    }

    if (unassigned.length === 0) {
      alert('No unassigned players available!');
      return;
    }

    const toAssign = Math.min(available, unassigned.length);
    const playersToAssign = unassigned.slice(0, toAssign);

    if (confirm(`Assign ${toAssign} unassigned players to BG${bg + 1}?`)) {
      const updatedPlayers = players.map(p => {
        if (playersToAssign.some(pa => pa.id === p.id)) {
          return { ...p, bgAssignment: bg };
        }
        return p;
      });
      onUpdatePlayers(updatedPlayers);
    }
  };

  const getBgColor = (bg: number | null) => {
    if (bg === null) return 'text-gray-400';
    return ['text-blue-400', 'text-green-400', 'text-purple-400'][bg] || 'text-gray-400';
  };

  const getBgCount = (bg: number) => players.filter(p => p.bgAssignment === bg).length;

  const filteredPlayers = players
    .filter(p => {
      // Search filter
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // BG filter
      if (filterBg === 'unassigned' && p.bgAssignment !== -1) return false;
      if (filterBg !== 'all' && filterBg !== 'unassigned' && p.bgAssignment !== filterBg) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'bg': return (a.bgAssignment ?? 999) - (b.bgAssignment ?? 999);
        case 'pathFights': return b.pathFights - a.pathFights;
        case 'mbFights': return b.mbFights - a.mbFights;
        case 'deaths': return b.totalDeaths - a.totalDeaths;
        default: return 0;
      }
    });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Player Management</h2>
            <p className="text-gray-400 text-sm">
              Total: {players.length} | 
              Assigned: {players.filter(p => p.bgAssignment !== -1).length} | 
              Unassigned: {players.filter(p => p.bgAssignment === -1).length}
            </p>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">
            Close
          </button>
        </div>

        {/* BG Capacity Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map(bg => (
            <div key={bg} className="p-4 bg-slate-700 rounded-lg border-2 border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${getBgColor(bg)}`}>BG{bg + 1}</span>
                <span className={`text-sm ${getBgCount(bg) >= 10 ? 'text-red-400' : 'text-green-400'}`}>
                  {getBgCount(bg)}/10
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    getBgCount(bg) >= 10 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(getBgCount(bg) / 10) * 100}%` }}
                />
              </div>
              <button
                onClick={() => bulkAssignToBG(bg)}
                disabled={getBgCount(bg) >= 10}
                className="w-full mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs rounded"
              >
                Auto-Assign
              </button>
            </div>
          ))}
        </div>

        {/* Add Player */}
        <div className="mb-6 p-4 bg-slate-700 rounded-lg">
          <h3 className="font-semibold mb-2">Add New Player</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="Player name..."
              className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg border-2 border-slate-500 focus:border-green-500 focus:outline-none"
            />
            <button onClick={addPlayer} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold">
              Add Player
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 p-4 bg-slate-700 rounded-lg">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search players..."
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Filter by BG</label>
              <select
                value={filterBg}
                onChange={(e) => setFilterBg(e.target.value === 'all' ? 'all' : e.target.value === 'unassigned' ? 'unassigned' : parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Players</option>
                <option value="unassigned">Unassigned</option>
                <option value="0">BG1</option>
                <option value="1">BG2</option>
                <option value="2">BG3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="bg">Battlegroup</option>
                <option value="pathFights">Path Fights</option>
                <option value="mbFights">MB Fights</option>
                <option value="deaths">Deaths</option>
              </select>
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="space-y-2">
          {filteredPlayers.map(player => (
            <div key={player.id} className="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-purple-500 transition">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Player Info */}
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-lg">{player.name}</span>
                </div>

                {/* BG Assignment */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">BG:</span>
                  <select
                    value={player.bgAssignment === -1 ? 'none' : player.bgAssignment}
                    onChange={(e) => transferPlayerToBG(player.id, e.target.value === 'none' ? -1 : parseInt(e.target.value))}
                    className={`px-3 py-1 rounded-lg font-bold border-2 focus:outline-none ${
                      player.bgAssignment === -1
                        ? 'bg-gray-600 text-gray-300 border-gray-500'
                        : `bg-slate-600 ${getBgColor(player.bgAssignment)} border-slate-500`
                    }`}
                  >
                    <option value="none">Unassigned</option>
                    <option value="0">BG1 ({getBgCount(0)}/10)</option>
                    <option value="1">BG2 ({getBgCount(1)}/10)</option>
                    <option value="2">BG3 ({getBgCount(2)}/10)</option>
                  </select>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <label className="text-gray-400 block text-xs">Path Fights</label>
                    <input
                      type="number"
                      min="0"
                      value={player.pathFights}
                      onChange={(e) => updatePlayer(player.id, { pathFights: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-16 px-2 py-1 bg-slate-600 text-cyan-300 rounded text-center font-bold border border-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block text-xs">MB Fights</label>
                    <input
                      type="number"
                      min="0"
                      value={player.mbFights}
                      onChange={(e) => updatePlayer(player.id, { mbFights: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-16 px-2 py-1 bg-slate-600 text-orange-300 rounded text-center font-bold border border-slate-500 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block text-xs">Deaths</label>
                    <span className="block w-16 px-2 py-1 bg-red-900/30 text-red-300 rounded text-center font-bold">
                      {player.totalDeaths}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded font-semibold text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No players found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
