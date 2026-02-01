import { Player } from '@/types';
import { useState } from 'react';

interface PlayerManagementProps {
  players: Player[];
  onClose: () => void;
  onUpdatePlayers: (players: Player[]) => void;
}

export default function PlayerManagement({ players, onClose, onUpdatePlayers }: PlayerManagementProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [bulkAssignBg, setBulkAssignBg] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'unassigned' | 'bg1' | 'bg2' | 'bg3'>('unassigned');

  // Initialize player fields if needed
  const initializePlayer = (player: Player): Player => ({
    id: player.id,
    name: player.name,
    bgAssignment: player.bgAssignment ?? -1,
    pathFights: player.pathFights ?? 0,
    mbFights: player.mbFights ?? 0,
    totalDeaths: player.totalDeaths ?? 0,
    warsParticipated: player.warsParticipated ?? 0,
  });

  const initializedPlayers = players.map(initializePlayer);

  // Group players by BG assignment
  const unassignedPlayers = initializedPlayers.filter(p => p.bgAssignment === -1);
  const bg1Players = initializedPlayers.filter(p => p.bgAssignment === 0);
  const bg2Players = initializedPlayers.filter(p => p.bgAssignment === 1);
  const bg3Players = initializedPlayers.filter(p => p.bgAssignment === 2);

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;

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

  const handleBulkAssign = () => {
    if (bulkAssignBg === -1) {
      alert('Please select a battlegroup');
      return;
    }

    const updatedPlayers = initializedPlayers.map(player =>
      player.bgAssignment === -1 ? { ...player, bgAssignment: bulkAssignBg } : player
    );

    onUpdatePlayers(updatedPlayers);
    setBulkAssignBg(-1);
  };

  const handleAssignToBg = (playerId: string, bgIndex: number) => {
    const updatedPlayers = initializedPlayers.map(player =>
      player.id === playerId ? { ...player, bgAssignment: bgIndex } : player
    );
    onUpdatePlayers(updatedPlayers);
  };

  const handleRemovePlayer = (playerId: string) => {
    if (confirm('Are you sure you want to remove this player?')) {
      onUpdatePlayers(initializedPlayers.filter(p => p.id !== playerId));
    }
  };

  const PlayerCard = ({ player }: { player: Player }) => (
    <div className="bg-gray-700 rounded p-3 mb-2">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-bold text-white">{player.name}</div>
          <div className="text-xs text-gray-400 mt-1">
            Fights: {player.pathFights + player.mbFights} | Deaths: {player.totalDeaths}
          </div>
        </div>
        <button
          onClick={() => handleRemovePlayer(player.id)}
          className="text-red-400 hover:text-red-300 text-sm ml-2"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => handleAssignToBg(player.id, 0)}
          className={`flex-1 text-xs py-1 px-2 rounded ${
            player.bgAssignment === 0
              ? 'bg-purple-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          BG1
        </button>
        <button
          onClick={() => handleAssignToBg(player.id, 1)}
          className={`flex-1 text-xs py-1 px-2 rounded ${
            player.bgAssignment === 1
              ? 'bg-purple-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          BG2
        </button>
        <button
          onClick={() => handleAssignToBg(player.id, 2)}
          className={`flex-1 text-xs py-1 px-2 rounded ${
            player.bgAssignment === 2
              ? 'bg-purple-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          BG3
        </button>
        <button
          onClick={() => handleAssignToBg(player.id, -1)}
          className={`flex-1 text-xs py-1 px-2 rounded ${
            player.bgAssignment === -1
              ? 'bg-gray-800 text-white border border-gray-600'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          Unassign
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Players</h2>
            <p className="text-gray-400 text-sm mt-0.5">{initializedPlayers.length} total • {bg1Players.length + bg2Players.length + bg3Players.length} assigned</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Add Player Section */}
        <div className="bg-gray-800/50 border-b border-gray-700 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
              placeholder="Add new player..."
              className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAddPlayer}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm transition"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800/30">
          {[
            { id: 'unassigned' as const, label: `Unassigned (${unassignedPlayers.length})` },
            { id: 'bg1' as const, label: `BG1 (${bg1Players.length}/10)` },
            { id: 'bg2' as const, label: `BG2 (${bg2Players.length}/10)` },
            { id: 'bg3' as const, label: `BG3 (${bg3Players.length}/10)` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-3 overflow-y-auto max-h-[calc(90vh-220px)]">
          {activeTab === 'unassigned' && (
            <div className="space-y-3">
              {unassignedPlayers.length === 0 ? (
                <p className="text-gray-400 text-center py-8">All players assigned!</p>
              ) : (
                <>
                  {unassignedPlayers.length > 0 && (
                    <div className="bg-gray-800/50 rounded p-3 mb-4 border-l-2 border-yellow-500">
                      <select
                        value={bulkAssignBg}
                        onChange={(e) => setBulkAssignBg(parseInt(e.target.value))}
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={-1}>Select BG to bulk assign...</option>
                        <option value={0}>BG1</option>
                        <option value={1}>BG2</option>
                        <option value={2}>BG3</option>
                      </select>
                      <button
                        onClick={handleBulkAssign}
                        disabled={bulkAssignBg === -1}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded text-sm transition"
                      >
                        Assign All
                      </button>
                    </div>
                  )}
                  {unassignedPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'bg1' && (
            <div className="space-y-3">
              {bg1Players.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No players assigned to BG1</p>
              ) : (
                bg1Players.map(player => (
                  <PlayerCard key={player.id} player={player} />
                ))
              )}
            </div>
          )}

          {activeTab === 'bg2' && (
            <div className="space-y-3">
              {bg2Players.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No players assigned to BG2</p>
              ) : (
                bg2Players.map(player => (
                  <PlayerCard key={player.id} player={player} />
                ))
              )}
            </div>
          )}

          {activeTab === 'bg3' && (
            <div className="space-y-3">
              {bg3Players.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No players assigned to BG3</p>
              ) : (
                bg3Players.map(player => (
                  <PlayerCard key={player.id} player={player} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}