import { MiniBoss, Player } from '@/types';

interface MiniBossCardProps {
  miniBoss: MiniBoss;
  bgIndex: number;
  players: Player[];
  onUpdate: (miniBossId: string, updates: Partial<MiniBoss>) => void;
}

// Helper function to safely convert values to numbers, preventing NaN
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper function to calculate attack bonus for a node based on deaths
const calculateNodeBonus = (deaths: number): number => {
  if (deaths === 0) return 270;
  if (deaths === 1) return 180;
  if (deaths === 2) return 90;
  return 0;
};

export default function MiniBossCard({ miniBoss, bgIndex, players, onUpdate }: MiniBossCardProps) {
  // Filter players assigned to this battlegroup
  const availablePlayers = players.filter(p => p.bgAssignment === bgIndex);

  const totalDeaths = safeNumber(miniBoss.primaryDeaths) + safeNumber(miniBoss.backupDeaths);
  const mbBonus = calculateNodeBonus(totalDeaths);
  const bgPlayers = players.filter(p => p.bgAssignment === bgIndex);

  return (
    <div className="bg-slate-800/80 rounded-xl p-4 border border-orange-500/40">
      {/* Mini Boss Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-orange-300">{miniBoss.name}</h3>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Node {miniBoss.nodeNumber}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Deaths</div>
          <div className="text-lg font-black text-red-400">{totalDeaths || 0}</div>
        </div>
      </div>

      {/* Status Dropdown */}
      <div className="mb-4">
        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Status</label>
        <select
          value={miniBoss.status}
          onChange={(e) => onUpdate(miniBoss.id, { status: e.target.value as MiniBoss['status'] })}
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
        >
          <option value="not-started">⭕ Not Started</option>
          <option value="in-progress">🟡 In Progress</option>
          <option value="completed">✅ Completed</option>
        </select>
      </div>

      {/* Primary Player Section - BLUE */}
      <div className="bg-blue-900/30 rounded-xl p-3 mb-3 border border-blue-500/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-300 font-black text-xs uppercase tracking-wider">👤 Primary Player</span>
          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-lg font-black">Deaths: {safeNumber(miniBoss.primaryDeaths)}</span>
        </div>

        <select
          value={miniBoss.assignedPlayerId}
          onChange={(e) => onUpdate(miniBoss.id, { assignedPlayerId: e.target.value })}
          className="w-full bg-blue-900/50 text-white rounded-lg px-3 py-2 border border-blue-600/50 focus:border-blue-400 focus:outline-none text-sm mb-2"
        >
          <option value="">Select Primary Player...</option>
          {availablePlayers.map(player => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs text-blue-200/80 cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={!!miniBoss.playerNoShow}
            onChange={(e) => onUpdate(miniBoss.id, { playerNoShow: e.target.checked })}
            className="w-4 h-4 cursor-pointer"
          />
          <span>Player No-Show</span>
        </label>

        {miniBoss.playerNoShow && (
          <div className="mt-2">
            <select
              value={miniBoss.replacedByPlayerId}
              onChange={(e) => onUpdate(miniBoss.id, { replacedByPlayerId: e.target.value })}
              className="w-full bg-blue-900/50 text-white rounded-lg px-3 py-2 border border-blue-500/50 focus:border-blue-300 focus:outline-none text-sm"
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

        <div className="mt-2">
          <label className="block text-[10px] text-blue-300 uppercase tracking-wider font-black mb-1">Deaths by Primary</label>
          <input
            type="number"
            min="0"
            max="3"
            value={safeNumber(miniBoss.primaryDeaths)}
            onChange={(e) => onUpdate(miniBoss.id, { primaryDeaths: Math.max(0, parseInt(e.target.value) || 0) })}
            className="w-full bg-blue-900/50 text-white rounded-lg px-3 py-2 border border-blue-600/50 focus:border-blue-400 focus:outline-none text-sm text-center"
          />
        </div>
      </div>

      {/* Backup Player Section - ORANGE (Optional) */}
      <div className="bg-orange-900/30 rounded-xl p-3 border border-orange-500/40">
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-2 text-orange-300 font-black text-xs uppercase tracking-wider cursor-pointer">
            <input
              type="checkbox"
              checked={!!miniBoss.backupHelped}
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
              className="w-full bg-orange-900/50 text-white rounded-lg px-3 py-2 border border-orange-600/50 focus:border-orange-400 focus:outline-none text-sm mb-2"
            >
              <option value="">Any of {bgPlayers.length} BG players</option>
              {bgPlayers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>

            <div>
              <label className="block text-[10px] text-orange-300 uppercase tracking-wider font-black mb-1">Deaths by Backup</label>
              <input
                type="number"
                min="0"
                max="3"
                value={safeNumber(miniBoss.backupDeaths)}
                onChange={(e) => onUpdate(miniBoss.id, { backupDeaths: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-orange-900/50 text-white rounded-lg px-3 py-2 border border-orange-600/50 focus:border-orange-400 focus:outline-none text-sm text-center"
              />
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      <div className="mt-3">
        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Notes</label>
        <textarea
          value={miniBoss.notes}
          onChange={(e) => onUpdate(miniBoss.id, { notes: e.target.value })}
          placeholder="Add notes here..."
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-orange-500 focus:outline-none text-sm resize-none"
          rows={2}
        />
      </div>

      {/* Attack Bonus Display */}
      <div className="mt-3 p-2 bg-yellow-900/20 rounded-lg border border-yellow-600/30">
        <div className="text-xs text-yellow-300">
          <span className="font-black uppercase tracking-wider">Attack Bonus: </span>
          <span className="text-base font-black">{mbBonus}</span>
          <span className="font-medium"> pts</span>
        </div>
      </div>
    </div>
  );
}
