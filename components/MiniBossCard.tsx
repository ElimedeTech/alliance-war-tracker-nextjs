import { MiniBoss, Player } from '@/types';

interface MiniBossCardProps {
  miniBoss: MiniBoss;
  bgIndex: number;
  players: Player[];
  onUpdate: (miniBossId: string, updates: Partial<MiniBoss>) => void;
}

// Helper function to calculate attack bonus for a node based on deaths
// Each node starts at 270, loses 90 per death (max 3 deaths = 0 bonus)
const calculateNodeBonus = (deaths: number): number => {
  if (deaths === 0) return 270;
  if (deaths === 1) return 180;
  if (deaths === 2) return 90;
  return 0; // 3+ deaths = 0 bonus
};

export default function MiniBossCard({ miniBoss, bgIndex, players, onUpdate }: MiniBossCardProps) {
  // Filter players assigned to this battlegroup
  const availablePlayers = players.filter(p => p.bgAssignment === bgIndex);

  const totalDeaths = miniBoss.primaryDeaths + miniBoss.backupDeaths;
  const mbBonus = calculateNodeBonus(totalDeaths);
  const bgPlayers = players.filter(p => p.bgAssignment === bgIndex);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-orange-500">
      {/* Mini Boss Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-orange-300">{miniBoss.name}</h3>
          <div className="text-xs text-gray-500">Node {miniBoss.nodeNumber}</div>
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
          value={miniBoss.status}
          onChange={(e) => onUpdate(miniBoss.id, { status: e.target.value as MiniBoss['status'] })}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none"
        >
          <option value="not-started">⭕ Not Started</option>
          <option value="in-progress">🟡 In Progress</option>
          <option value="completed">✅ Completed</option>
        </select>
      </div>

      {/* Primary Player Section - BLUE */}
      <div className="bg-blue-900/30 rounded-lg p-3 mb-3 border border-blue-500">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-300 font-semibold text-sm">👤 Primary Player</span>
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Deaths: {miniBoss.primaryDeaths}</span>
        </div>

        {/* Primary Player Select */}
        <select
          value={miniBoss.assignedPlayerId}
          onChange={(e) => onUpdate(miniBoss.id, { assignedPlayerId: e.target.value })}
          className="w-full bg-blue-800 text-white rounded px-3 py-2 border border-blue-600 focus:border-blue-400 focus:outline-none text-sm mb-2"
        >
          <option value="">Select Primary Player...</option>
          {availablePlayers.map(player => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>

        {/* No-Show Checkbox */}
        <label className="flex items-center gap-2 text-sm text-blue-200 cursor-pointer">
          <input
            type="checkbox"
            checked={miniBoss.playerNoShow}
            onChange={(e) => onUpdate(miniBoss.id, { playerNoShow: e.target.checked })}
            className="w-4 h-4 cursor-pointer"
          />
          <span>Player No-Show</span>
        </label>

        {/* Replaced By Player (if no-show) */}
        {miniBoss.playerNoShow && (
          <div className="mt-2">
            <select
              value={miniBoss.replacedByPlayerId}
              onChange={(e) => onUpdate(miniBoss.id, { replacedByPlayerId: e.target.value })}
              className="w-full bg-blue-700 text-white rounded px-3 py-2 border border-blue-500 focus:border-blue-300 focus:outline-none text-sm"
            >
              <option value="">Who replaced them?</option>
              {bgPlayers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Primary Deaths Input */}
        <div className="mt-2">
          <label className="block text-xs text-blue-300 mb-1">Deaths by Primary</label>
          <input
            type="number"
            min="0"
            max="3"
            value={miniBoss.primaryDeaths}
            onChange={(e) => onUpdate(miniBoss.id, { primaryDeaths: Math.max(0, parseInt(e.target.value) || 0) })}
            className="w-full bg-blue-800 text-white rounded px-3 py-2 border border-blue-600 focus:border-blue-400 focus:outline-none text-sm text-center"
          />
        </div>
      </div>

      {/* Backup Player Section - ORANGE (Optional) */}
      <div className="bg-orange-900/30 rounded-lg p-3 border border-orange-500">
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-2 text-orange-300 font-semibold text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={miniBoss.backupHelped}
              onChange={(e) => onUpdate(miniBoss.id, { backupHelped: e.target.checked })}
              className="w-4 h-4 cursor-pointer"
            />
            <span>🤝 Backup Helped</span>
          </label>
        </div>

        {miniBoss.backupHelped && (
          <>
            <select
              value={miniBoss.backupPlayerId}
              onChange={(e) => onUpdate(miniBoss.id, { backupPlayerId: e.target.value })}
              className="w-full bg-orange-800 text-white rounded px-3 py-2 border border-orange-600 focus:border-orange-400 focus:outline-none text-sm mb-2"
            >
              <option value="">Any of {bgPlayers.length} BG players</option>
              {bgPlayers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>

            <div>
              <label className="block text-xs text-orange-300 mb-1">Deaths by Backup</label>
              <input
                type="number"
                min="0"
                max="3"
                value={miniBoss.backupDeaths}
                onChange={(e) => onUpdate(miniBoss.id, { backupDeaths: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-orange-800 text-white rounded px-3 py-2 border border-orange-600 focus:border-orange-400 focus:outline-none text-sm text-center"
              />
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      <div className="mt-3">
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea
          value={miniBoss.notes}
          onChange={(e) => onUpdate(miniBoss.id, { notes: e.target.value })}
          placeholder="Add notes here..."
          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none text-sm resize-none"
          rows={2}
        />
      </div>

      {/* Attack Bonus Display */}
      <div className="mt-3 p-2 bg-yellow-900/30 rounded border border-yellow-600">
        <div className="text-sm text-yellow-300">
          <span className="font-semibold">Attack Bonus: </span>
          <span className="text-lg font-bold">{mbBonus}</span> pts
        </div>
      </div>
    </div>
  );
}
