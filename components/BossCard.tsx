import { Boss, Player } from '@/types';

interface BossCardProps {
  boss: Boss;
  bgIndex: number;
  players: Player[];
  onUpdate: (bossId: string, updates: Partial<Boss>) => void;
}

// Helper function to safely convert values to numbers, preventing NaN
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export default function BossCard({ boss, bgIndex, players, onUpdate }: BossCardProps) {
  // Filter players assigned to this battlegroup
  const availablePlayers = players.filter(p => p.bgAssignment === bgIndex);

  const totalDeaths = safeNumber(boss.primaryDeaths) + safeNumber(boss.backupDeaths);

  return (
    <div className="bg-slate-800/80 rounded-xl p-4 border border-red-500/40">
      {/* Boss Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-red-300">{boss.name}</h3>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Node {boss.nodeNumber}</div>
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
          value={boss.status}
          onChange={(e) => onUpdate(boss.id, { status: e.target.value as Boss['status'] })}
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-red-500 focus:outline-none text-sm"
        >
          <option value="not-started">⭕ Not Started</option>
          <option value="in-progress">🟡 In Progress</option>
          <option value="completed">✅ Completed</option>
        </select>
      </div>

      {/* Primary Player Section */}
      <div className="bg-blue-900/20 border border-blue-600/40 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-black text-blue-300 text-xs uppercase tracking-wider">Primary</h4>
          {boss.playerNoShow && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-lg font-black">No Show</span>}
        </div>

        <div className="mb-3">
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Player</label>
          <select
            value={boss.assignedPlayerId}
            onChange={(e) => onUpdate(boss.id, { assignedPlayerId: e.target.value })}
            className="w-full bg-slate-700 text-white rounded-lg px-2 py-1 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="">Assign Player...</option>
            {availablePlayers.map(player => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Deaths</label>
            <input
              type="number"
              min="0"
              value={safeNumber(boss.primaryDeaths)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate(boss.id, { primaryDeaths: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 text-white rounded-lg px-2 py-1 border border-slate-600 focus:border-blue-500 focus:outline-none text-center text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Assisted?</label>
            <select
              value={boss.backupHelped ? 'yes' : 'no'}
              onChange={(e) => onUpdate(boss.id, { backupHelped: e.target.value === 'yes' })}
              className="w-full bg-slate-700 text-white rounded-lg px-2 py-1 border border-slate-600 focus:border-blue-500 focus:outline-none text-center text-sm"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        <div className="mb-2">
          <label className="flex items-center text-xs text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={!!boss.playerNoShow}
              onChange={(e) => onUpdate(boss.id, { playerNoShow: e.target.checked })}
              className="mr-2"
            />
            Primary Player No Show
          </label>
        </div>

        {boss.playerNoShow && (
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Covered By</label>
            <select
              value={boss.replacedByPlayerId}
              onChange={(e) => onUpdate(boss.id, { replacedByPlayerId: e.target.value })}
              className="w-full bg-slate-700 text-white rounded-lg px-2 py-1 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="">Select Player...</option>
              {availablePlayers.filter(p => p.id !== boss.assignedPlayerId).map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Backup Player Section */}
      {boss.backupHelped && (
        <div className="bg-orange-900/20 border border-orange-600/40 rounded-xl p-3 mb-4">
          <h4 className="font-black text-orange-300 text-xs uppercase tracking-wider mb-3">Backup</h4>

          <div className="mb-3">
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Player</label>
            <select
              value={boss.backupPlayerId}
              onChange={(e) => onUpdate(boss.id, { backupPlayerId: e.target.value })}
              className="w-full bg-slate-700 text-white rounded-lg px-2 py-1 border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
            >
              <option value="">Select Backup...</option>
              {availablePlayers.filter(p => p.id !== boss.assignedPlayerId).map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Deaths</label>
            <input
              type="number"
              min="0"
              value={safeNumber(boss.backupDeaths)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate(boss.id, { backupDeaths: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 text-white rounded-lg px-2 py-1 border border-slate-600 focus:border-orange-500 focus:outline-none text-center text-sm"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-black mb-1">Notes</label>
        <textarea
          value={boss.notes}
          onChange={(e) => onUpdate(boss.id, { notes: e.target.value })}
          className="w-full bg-slate-700 text-white rounded-lg px-2 py-1 border border-slate-600 focus:border-red-500 focus:outline-none text-sm resize-none"
          rows={2}
          placeholder="Add notes..."
        />
      </div>
    </div>
  );
}
