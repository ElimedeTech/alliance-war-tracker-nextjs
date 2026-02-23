import { Path, Player } from '@/types';

interface EnhancedPathCardProps {
  path: Path;
  bgIndex: number;
  players: Player[];
  onUpdate: (pathId: string, updates: Partial<Path>) => void;
}

// Helper function to calculate attack bonus for a node based on deaths
const calculateNodeBonus = (deaths: number): number => {
  if (deaths === 0) return 270;
  if (deaths === 1) return 180;
  if (deaths === 2) return 90;
  return 0;
};

// Helper function to calculate path bonus with 2 nodes per path
const calculatePathBonus = (totalDeaths: number): number => {
  if (totalDeaths === 0) return 540;

  const node1Deaths = Math.ceil(totalDeaths / 2);
  const node2Deaths = totalDeaths - node1Deaths;

  let bonus = 0;
  if (node1Deaths === 0) bonus += 270;
  else if (node1Deaths === 1) bonus += 180;
  else if (node1Deaths === 2) bonus += 90;

  if (node2Deaths === 0) bonus += 270;
  else if (node2Deaths === 1) bonus += 180;
  else if (node2Deaths === 2) bonus += 90;

  return bonus;
};

export default function EnhancedPathCard({ path, bgIndex, players, onUpdate }: EnhancedPathCardProps) {
  const availablePlayers = players.filter(p => p.bgAssignment === bgIndex);

  const totalDeaths = path.primaryDeaths + path.backupDeaths;
  const pathBonus = calculatePathBonus(totalDeaths);
  const nodesCleared = path.status === 'completed' ? 2 : path.status === 'in-progress' ? 1 : 0;

  return (
    <div className="bg-slate-800/80 rounded-xl p-4 border border-purple-500/40">
      {/* Path Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-purple-300">Path {path.pathNumber}</h3>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Progress</div>
          <div className="text-lg font-black text-white">{nodesCleared}/2</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Deaths</div>
          <div className="text-lg font-black text-red-400">{totalDeaths}</div>
        </div>
      </div>

      {/* Status Dropdown */}
      <div className="mb-4">
        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Status</label>
        <select
          value={path.status}
          onChange={(e) => onUpdate(path.id, { status: e.target.value as Path['status'] })}
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-purple-500 focus:outline-none text-sm"
        >
          <option value="not-started">⭕ Not Started</option>
          <option value="in-progress">🟡 In Progress</option>
          <option value="completed">✅ Completed</option>
        </select>
      </div>

      {/* Primary Player Section - BLUE */}
      <div className="bg-blue-900/30 rounded-xl p-3 mb-3 border border-blue-500/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">💪</span>
          <h4 className="text-xs font-black uppercase tracking-wider text-blue-300">Primary Player</h4>
        </div>

        <select
          value={path.assignedPlayerId}
          onChange={(e) => onUpdate(path.id, { assignedPlayerId: e.target.value })}
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 mb-2 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
        >
          <option value="">Assign Player...</option>
          {availablePlayers.map(player => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>

        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Primary Deaths</label>
          <input
            type="number"
            min="0"
            value={path.primaryDeaths}
            onChange={(e) => onUpdate(path.id, { primaryDeaths: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none text-center text-xl font-black"
          />
        </div>
      </div>

      {/* Player No-Show Section - ORANGE */}
      <div className="bg-orange-900/20 rounded-xl p-3 mb-3 border border-orange-500/30">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={path.playerNoShow}
            onChange={(e) => onUpdate(path.id, { playerNoShow: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-lg">⚠️</span>
          <h4 className="text-xs font-black uppercase tracking-wider text-orange-300">Player No-Show?</h4>
        </div>

        {path.playerNoShow && (
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Covered By</label>
            <select
              value={path.replacedByPlayerId}
              onChange={(e) => onUpdate(path.id, { replacedByPlayerId: e.target.value })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
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
      <div className="bg-green-900/20 rounded-xl p-3 mb-3 border border-green-500/30">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={path.backupHelped}
            onChange={(e) => onUpdate(path.id, { backupHelped: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-lg">🛡️</span>
          <h4 className="text-xs font-black uppercase tracking-wider text-green-300">Backup Helped?</h4>
          <span className="text-[10px] text-green-400/70 font-medium">(Any of 10 BG players)</span>
        </div>

        {path.backupHelped && (
          <>
            <select
              value={path.backupPlayerId}
              onChange={(e) => onUpdate(path.id, { backupPlayerId: e.target.value })}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 mb-2 border border-slate-600 focus:border-green-500 focus:outline-none text-sm"
            >
              <option value="">Select Backup Player (Any BG{bgIndex + 1} player)...</option>
              {availablePlayers.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Backup Deaths</label>
              <input
                type="number"
                min="0"
                value={path.backupDeaths}
                onChange={(e) => onUpdate(path.id, { backupDeaths: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-green-500 focus:outline-none text-center text-xl font-black"
              />
            </div>
          </>
        )}
      </div>

      {/* Attack Bonus Display */}
      <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/30">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-400 font-medium">Total Deaths:</span>
          <span className="text-base font-black text-red-400">{totalDeaths}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-400 font-medium">Path Attack Bonus:</span>
          <span className="text-lg font-black text-yellow-400">{pathBonus.toLocaleString()}</span>
        </div>
        <div className="text-[10px] text-slate-500 text-center font-medium">
          Max: 540 (270 × 2 nodes)
        </div>
        <div className="text-[10px] text-slate-500 text-center mt-0.5 font-medium">
          Formula: 0=270 | 1=180 | 2=90 | 3+=0
        </div>
      </div>

      {/* Notes */}
      {path.notes && (
        <div className="mt-3 text-xs text-slate-400 bg-slate-700/40 rounded-lg p-2 font-medium">
          <strong className="font-black">Notes:</strong> {path.notes}
        </div>
      )}
    </div>
  );
}
