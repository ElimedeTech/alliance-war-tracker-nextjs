import { Path, Player } from '@/types';

interface EnhancedPathCardProps {
  path: Path;
  bgIndex: number;
  players: Player[];
  onUpdate: (pathId: string, updates: Partial<Path>) => void;
}

// Helper function to calculate attack bonus for a node based on deaths
// Each node starts at 270, loses 90 per death (max 3 deaths = 0 bonus)
const calculateNodeBonus = (deaths: number): number => {
  if (deaths === 0) return 270;
  if (deaths === 1) return 180;
  if (deaths === 2) return 90;
  return 0; // 3+ deaths = 0 bonus
};

// Helper function to calculate path bonus intelligently
// Distributes deaths across 4 nodes to maximize bonus calculation
const calculatePathBonus = (totalDeaths: number): number => {
  if (totalDeaths === 0) return 1080; // 4 nodes × 270

  // Distribute deaths as evenly as possible across 4 nodes
  const deathsPerNode = Math.floor(totalDeaths / 4);
  const remainingDeaths = totalDeaths % 4;

  let bonus = 0;
  // Apply full sets of deaths to each node first
  for (let i = 0; i < 4; i++) {
    bonus += calculateNodeBonus(deathsPerNode);
  }

  // Distribute remaining deaths one by one to nodes
  for (let i = 0; i < remainingDeaths; i++) {
    bonus -= 90; // Each additional death costs 90 per node
  }

  return Math.max(0, bonus);
};

export default function EnhancedPathCard({ path, bgIndex, players, onUpdate }: EnhancedPathCardProps) {
  // Filter players assigned to this battlegroup
  const availablePlayers = players.filter(p => p.bgAssignment === bgIndex);

  const totalDeaths = path.primaryDeaths + path.backupDeaths;
  const pathBonus = calculatePathBonus(totalDeaths);
  const nodesCleared = path.status === 'completed' ? 4 : path.status === 'in-progress' ? 2 : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-purple-500">
      {/* Path Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-purple-300">Path {path.pathNumber}</h3>
        <div className="text-right">
          <div className="text-sm text-gray-400">Progress</div>
          <div className="text-lg font-bold text-white">{nodesCleared}/4</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Deaths</div>
          <div className="text-lg font-bold text-red-400">{totalDeaths}</div>
        </div>
      </div>

      {/* Status Dropdown */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Status</label>
        <select
          value={path.status}
          onChange={(e) => onUpdate(path.id, { status: e.target.value as Path['status'] })}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
        >
          <option value="not-started">⭕ Not Started</option>
          <option value="in-progress">🟡 In Progress</option>
          <option value="completed">✅ Completed</option>
        </select>
      </div>

      {/* Primary Player Section - BLUE */}
      <div className="bg-blue-900/30 rounded-lg p-3 mb-3 border border-blue-500">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">💪</span>
          <h4 className="text-sm font-bold text-blue-300">Primary Player</h4>
        </div>
        
        <select
          value={path.assignedPlayerId}
          onChange={(e) => onUpdate(path.id, { assignedPlayerId: e.target.value })}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 mb-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Assign Player...</option>
          {availablePlayers.map(player => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Primary Deaths</label>
          <input
            type="number"
            min="0"
            value={path.primaryDeaths}
            onChange={(e) => onUpdate(path.id, { primaryDeaths: parseInt(e.target.value) || 0 })}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none text-center text-xl font-bold"
          />
        </div>
      </div>

      {/* Player No-Show Section - ORANGE */}
      <div className="bg-orange-900/30 rounded-lg p-3 mb-3 border border-orange-500">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={path.playerNoShow}
            onChange={(e) => onUpdate(path.id, { playerNoShow: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-lg">⚠️</span>
          <h4 className="text-sm font-bold text-orange-300">Player No-Show?</h4>
        </div>

        {path.playerNoShow && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Covered By</label>
            <select
              value={path.replacedByPlayerId}
              onChange={(e) => onUpdate(path.id, { replacedByPlayerId: e.target.value })}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Select Player...</option>
              {availablePlayers.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Backup Player Section - GREEN */}
      <div className="bg-green-900/30 rounded-lg p-3 mb-3 border border-green-500">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={path.backupHelped}
            onChange={(e) => onUpdate(path.id, { backupHelped: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-lg">🛡️</span>
          <h4 className="text-sm font-bold text-green-300">Backup Helped?</h4>
          <span className="text-xs text-green-400">(Any of 10 BG players)</span>
        </div>

        {path.backupHelped && (
          <>
            <select
              value={path.backupPlayerId}
              onChange={(e) => onUpdate(path.id, { backupPlayerId: e.target.value })}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 mb-2 border border-gray-600 focus:border-green-500 focus:outline-none"
            >
              <option value="">Select Backup Player (Any BG{bgIndex + 1} player)...</option>
              {availablePlayers.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Backup Deaths</label>
              <input
                type="number"
                min="0"
                value={path.backupDeaths}
                onChange={(e) => onUpdate(path.id, { backupDeaths: parseInt(e.target.value) || 0 })}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-green-500 focus:outline-none text-center text-xl font-bold"
              />
            </div>
          </>
        )}
      </div>

      {/* Attack Bonus Display */}
      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-400">Total Deaths:</span>
          <span className="text-lg font-bold text-red-400">{totalDeaths}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Path Attack Bonus:</span>
          <span className="text-xl font-bold text-yellow-400">{pathBonus.toLocaleString()}</span>
        </div>
        <div className="text-xs text-gray-500 text-center">
          Max: 1,080 (270 × 4 nodes)
        </div>
        <div className="text-xs text-gray-500 text-center mt-1">
          Formula: 0=270 | 1=180 | 2=90 | 3+=0
        </div>
      </div>

      {/* Notes */}
      {path.notes && (
        <div className="mt-3 text-sm text-gray-400 bg-gray-700 rounded p-2">
          <strong>Notes:</strong> {path.notes}
        </div>
      )}
    </div>
  );
}