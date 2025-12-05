import { Battlegroup, Player } from '@/types';
import EnhancedPathCard from './EnhancedPathCard';
import MiniBossCard from './MiniBossCard';

interface EnhancedBattlegroupContentProps {
  battlegroup: Battlegroup;
  bgIndex: number;
  players: Player[];
  onUpdate: (updates: Partial<Battlegroup>) => void;
}

// Calculate exploration percentage based on nodes cleared
// Total nodes: 9 paths + 13 mini bosses + 1 boss = 23 nodes
const calculateExploration = (battlegroup: Battlegroup): number => {
  let nodesCleared = 0;
  const totalNodes = 23; // 9 paths + 13 mini bosses + 1 boss

  // Count completed paths (each path = 1 node for exploration purposes)
  const completedPaths = (battlegroup.paths || []).filter(p => p.status === 'completed').length;
  nodesCleared += completedPaths;

  // Count completed mini bosses
  const completedMiniBosses = (battlegroup.miniBosses || []).filter(mb => mb.status === 'completed').length;
  nodesCleared += completedMiniBosses;

  // Check if boss is completed
  if (battlegroup.boss.status === 'completed') {
    nodesCleared += 1;
  }

  // Calculate percentage
  const exploration = Math.round((nodesCleared / totalNodes) * 100);
  return Math.min(100, Math.max(0, exploration)); // Clamp between 0-100
};

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
// Strategy: Apply deaths evenly across nodes for worst-case scenario
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

export default function EnhancedBattlegroupContent({
  battlegroup,
  bgIndex,
  players,
  onUpdate,
}: EnhancedBattlegroupContentProps) {
  // Calculate BG statistics
  const calculateBgStats = () => {
    let totalDeaths = 0;
    let nodesCleared = 0;
    let totalBonus = 0;

    // Path stats (handle old war format)
    const paths = battlegroup.paths || [];
    paths.forEach(path => {
      totalDeaths += path.primaryDeaths + path.backupDeaths;
      if (path.status === 'completed') nodesCleared += 4;
      else if (path.status === 'in-progress') nodesCleared += 2;

      // Calculate path bonus based on total deaths
      // Max path bonus: 1,080 (4 nodes × 270)
      const pathDeaths = path.primaryDeaths + path.backupDeaths;
      totalBonus += calculatePathBonus(pathDeaths);
    });

    // Mini Boss stats (handle old war format)
    const miniBosses = battlegroup.miniBosses || [];
    miniBosses.forEach(mb => {
      totalDeaths += mb.primaryDeaths + mb.backupDeaths;
      if (mb.status === 'completed') nodesCleared += 1;

      // Calculate MB bonus (single node, max 270)
      const mbDeaths = mb.primaryDeaths + mb.backupDeaths;
      totalBonus += calculateNodeBonus(mbDeaths);
    });

    // Boss stats
    totalDeaths += battlegroup.boss.deaths;
    if (battlegroup.boss.status === 'completed') {
      nodesCleared += 1;
      // Calculate boss bonus (single node, max 270)
      totalBonus += calculateNodeBonus(battlegroup.boss.deaths);
    }

    return { totalDeaths, nodesCleared, totalBonus };
  };

  const stats = calculateBgStats();
  const currentExploration = calculateExploration(battlegroup);

  // Count assigned players
  const assignedPlayers = new Set<string>();
  const paths = battlegroup.paths || [];
  const miniBosses = battlegroup.miniBosses || [];
  
  paths.forEach(path => {
    if (path.assignedPlayerId) assignedPlayers.add(path.assignedPlayerId);
    if (path.backupPlayerId) assignedPlayers.add(path.backupPlayerId);
    if (path.replacedByPlayerId) assignedPlayers.add(path.replacedByPlayerId);
  });
  miniBosses.forEach(mb => {
    if (mb.assignedPlayerId) assignedPlayers.add(mb.assignedPlayerId);
    if (mb.backupPlayerId) assignedPlayers.add(mb.backupPlayerId);
    if (mb.replacedByPlayerId) assignedPlayers.add(mb.replacedByPlayerId);
  });
  if (battlegroup.boss?.assignedPlayer) assignedPlayers.add(battlegroup.boss.assignedPlayer);

  // Handle path updates
  const handlePathUpdate = (pathId: string, updates: any) => {
    const paths = battlegroup.paths || [];
    const updatedPaths = paths.map(path =>
      path.id === pathId ? { ...path, ...updates } : path
    );
    const updatedBg = { paths: updatedPaths };
    
    // Auto-calculate exploration after path update
    const exploration = calculateExploration({ ...battlegroup, ...updatedBg });
    onUpdate({ ...updatedBg, exploration });
  };

  // Handle mini boss updates
  const handleMiniBossUpdate = (mbId: string, updates: any) => {
    const miniBosses = battlegroup.miniBosses || [];
    const updatedMiniBosses = miniBosses.map(mb =>
      mb.id === mbId ? { ...mb, ...updates } : mb
    );
    const updatedBg = { miniBosses: updatedMiniBosses };
    
    // Auto-calculate exploration after mini boss update
    const exploration = calculateExploration({ ...battlegroup, ...updatedBg });
    onUpdate({ ...updatedBg, exploration });
  };

  // Handle boss updates
  const handleBossUpdate = (field: string, value: any) => {
    const updatedBg = {
      boss: {
        ...battlegroup.boss,
        [field]: value,
      },
    };
    
    // Auto-calculate exploration after boss update
    const exploration = calculateExploration({ ...battlegroup, ...updatedBg });
    onUpdate({ ...updatedBg, exploration });
  };

  return (
    <div className="space-y-6">
      {/* BG Summary Dashboard */}
      <div className="bg-gray-800 rounded-lg p-4 border border-purple-500">
        <h2 className="text-2xl font-bold text-purple-300 mb-4">
          BG{battlegroup.bgNumber} Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Nodes Cleared</div>
            <div className="text-2xl font-bold text-white">{stats.nodesCleared}/50</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Exploration</div>
            <div className="text-2xl font-bold text-cyan-400">{currentExploration}%</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Total Deaths</div>
            <div className="text-2xl font-bold text-red-400">{stats.totalDeaths}</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Attack Bonus</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.totalBonus.toLocaleString()}</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Players Active</div>
            <div className="text-2xl font-bold text-blue-400">{assignedPlayers.size}</div>
          </div>
        </div>
        <div className="mt-3 text-center text-sm text-gray-400">
          Max Attack Bonus: 13,500 (9 paths × 1,080 + 13 MBs × 270 + 1 boss × 270)
        </div>
      </div>

      {/* Defense Paths Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-300">Defense Paths (Nodes 1-36)</h2>
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            {(battlegroup.paths || []).filter(p => p.status === 'completed').length}/9 Complete
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(battlegroup.paths || []).map((path) => (
            <EnhancedPathCard
              key={path.id}
              path={path}
              bgIndex={bgIndex}
              players={players}
              onUpdate={handlePathUpdate}
            />
          ))}
        </div>
      </div>

      {/* Mini Bosses Section */}
      {battlegroup.miniBosses && battlegroup.miniBosses.length > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-orange-300">Mini Bosses (Nodes 37-49)</h2>
            <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {battlegroup.miniBosses.filter(mb => mb.status === 'completed').length}/13 Complete
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {battlegroup.miniBosses.map((miniBoss) => (
              <MiniBossCard
                key={miniBoss.id}
                miniBoss={miniBoss}
                bgIndex={bgIndex}
                players={players}
                onUpdate={handleMiniBossUpdate}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-yellow-300 mb-2">⚠️ Old War Format</h3>
          <p className="text-gray-300 mb-4">
            This war was created before V2.5 Enhanced and doesn't have mini boss tracking.
          </p>
          <p className="text-sm text-gray-400">
            Create a new war to use the V2.5 features (path-level assignments, backup tracking, mini bosses, etc.)
          </p>
        </div>
      )}

      {/* Final Boss Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-red-300">Final Boss (Node 50)</h2>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-red-500 max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-red-300">Boss</h3>
            <div className="text-right">
              <div className="text-sm text-gray-400">Deaths</div>
              <div className="text-lg font-bold text-red-400">{battlegroup.boss.deaths}</div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <select
              value={battlegroup.boss.status}
              onChange={(e) => handleBossUpdate('status', e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
            >
              <option value="not-started">⭕ Not Started</option>
              <option value="in-progress">🟡 In Progress</option>
              <option value="completed">✅ Completed</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Assigned Player</label>
            <select
              value={battlegroup.boss.assignedPlayer}
              onChange={(e) => handleBossUpdate('assignedPlayer', e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
            >
              <option value="">Assign Player...</option>
              {players.filter(p => p.bgAssignment === bgIndex).map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Deaths</label>
            <input
              type="number"
              min="0"
              value={battlegroup.boss.deaths}
              onChange={(e) => handleBossUpdate('deaths', parseInt(e.target.value) || 0)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none text-center text-xl font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}