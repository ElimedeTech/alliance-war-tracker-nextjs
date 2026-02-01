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

    // Check BG capacity (10 per BG)
    const bgCount = initializedPlayers.filter(p => p.bgAssignment === bulkAssignBg).length;
    if (bgCount >= 10) {
      alert(`BG${bulkAssignBg + 1} is full! (10/10 players)`);
      return;
    }

    // Filter out duplicates that already exist in the target BG
    const bgPlayerNames = initializedPlayers
      .filter(p => p.bgAssignment === bulkAssignBg)
      .map(p => p.name.toLowerCase());
    
    const validToAssign = unassignedPlayers.filter(
      p => !bgPlayerNames.includes(p.name.toLowerCase())
    );

    if (validToAssign.length === 0) {
      alert(`All unassigned players are already in BG${bulkAssignBg + 1}!`);
      return;
    }

    const available = 10 - bgCount;
    const toAssign = Math.min(available, validToAssign.length);

    const updatedPlayers = initializedPlayers.map(player => {
      if (player.bgAssignment === -1 && validToAssign.some(v => v.id === player.id)) {
        const assignCount = updatedPlayers.filter(p => p.bgAssignment === bulkAssignBg).length;
        if (assignCount < toAssign) {
          return { ...player, bgAssignment: bulkAssignBg };
        }
      }
      return player;
    });

    onUpdatePlayers(updatedPlayers);
    setBulkAssignBg(-1);
  };

  const handleAssignToBg = (playerId: string, bgIndex: number) => {
    const player = initializedPlayers.find(p => p.id === playerId);
    if (!player) return;

    // Check BG capacity if assigning (10 per BG)
    if (bgIndex !== -1) {
      const bgCount = initializedPlayers.filter(p => p.bgAssignment === bgIndex && p.id !== playerId).length;
      if (bgCount >= 10) {
        alert(`BG${bgIndex + 1} is full! (10/10 players)`);
        return;
      }

      // Check for duplicate player in the target BG
      const isDuplicate = initializedPlayers.some(
        p => p.name.toLowerCase() === player.name.toLowerCase() && p.bgAssignment === bgIndex && p.id !== playerId
      );
      if (isDuplicate) {
        alert(`${player.name} is already assigned to BG${bgIndex + 1}!`);
        return;
      }
    }

    const updatedPlayers = initializedPlayers.map(p =>
      p.id === playerId ? { ...p, bgAssignment: bgIndex } : p
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
      <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-purple-300">Player Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Player */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Add New Player</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                placeholder="Enter player name"
                className="flex-1 bg-gray-700 text-white rounded px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleAddPlayer}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition"
              >
                Add Player
              </button>
            </div>
          </div>

          {/* Bulk Assign */}
          {unassignedPlayers.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Bulk Assign Unassigned Players</h3>
              <div className="flex items-center gap-3">
                <span className="text-white">Assign to:</span>
                <select
                  value={bulkAssignBg}
                  onChange={(e) => setBulkAssignBg(parseInt(e.target.value))}
                  className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value={-1}>Select BG...</option>
                  <option value={0}>Battlegroup 1</option>
                  <option value={1}>Battlegroup 2</option>
                  <option value={2}>Battlegroup 3</option>
                </select>
                <button
                  onClick={handleBulkAssign}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {/* Player Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Unassigned */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-bold text-gray-300 mb-3">
                Unassigned ({unassignedPlayers.length})
              </h3>
              {unassignedPlayers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No unassigned players</p>
              ) : (
                <div>
                  {unassignedPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              )}
            </div>

            {/* BG1 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-purple-500">
              <h3 className="text-lg font-bold text-purple-300 mb-3">
                BG1 ({bg1Players.length}/10)
              </h3>
              {bg1Players.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No players assigned</p>
              ) : (
                <div>
                  {bg1Players.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              )}
            </div>

            {/* BG2 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-purple-500">
              <h3 className="text-lg font-bold text-purple-300 mb-3">
                BG2 ({bg2Players.length}/10)
              </h3>
              {bg2Players.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No players assigned</p>
              ) : (
                <div>
                  {bg2Players.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              )}
            </div>

            {/* BG3 */}
            <div className="bg-gray-800 rounded-lg p-4 border border-purple-500">
              <h3 className="text-lg font-bold text-purple-300 mb-3">
                BG3 ({bg3Players.length}/10)
              </h3>
              {bg3Players.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No players assigned</p>
              ) : (
                <div>
                  {bg3Players.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between text-lg">
              <span className="text-yellow-400 font-bold">Total Players:</span>
              <span className="text-white font-bold">{initializedPlayers.length}</span>
            </div>
            <div className="flex justify-between text-lg mt-2">
              <span className="text-green-400 font-bold">Assigned:</span>
              <span className="text-white font-bold">
                {bg1Players.length + bg2Players.length + bg3Players.length}
              </span>
            </div>
            <div className="flex justify-between text-lg mt-2">
              <span className="text-gray-400 font-bold">Unassigned:</span>
              <span className="text-white font-bold">{unassignedPlayers.length}</span>
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
