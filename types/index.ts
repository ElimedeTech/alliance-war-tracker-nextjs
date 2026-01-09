// V2.5 Enhanced Type Definitions
// Updated for simplified path-level player assignment with backup tracking

export interface Player {
  id: string;
  name: string;
  bgAssignment: number; // 0 = BG1, 1 = BG2, 2 = BG3, -1 = unassigned
  pathFights: number; // Total path fights (all seasons combined)
  mbFights: number; // Total mini boss fights (all seasons combined)
  totalDeaths: number; // Total deaths across all wars
  warsParticipated: number; // Number of wars participated in
  seasonStats?: Record<string, {
    pathFights: number;
    mbFights: number;
    totalDeaths: number;
    warsParticipated: number;
  }>; // Per-season aggregated stats
}

export interface Path {
  id: string;
  pathNumber: number; // 1-9
  assignedPlayerId: string; // Primary player assigned to this path
  primaryDeaths: number; // Deaths by primary player
  backupHelped: boolean; // Did a backup player help?
  backupPlayerId: string; // Backup player who helped
  backupDeaths: number; // Deaths by backup player
  playerNoShow: boolean; // Did primary player not show up?
  replacedByPlayerId: string; // Player who replaced no-show
  status: 'not-started' | 'in-progress' | 'completed';
  notes: string;
}

export interface MiniBoss {
  id: string;
  nodeNumber: number; // 37-49
  name: string; // "Mini Boss 1", "Mini Boss 2", etc.
  assignedPlayerId: string; // Primary player assigned
  primaryDeaths: number; // Deaths by primary player
  backupHelped: boolean; // Did a backup player help?
  backupPlayerId: string; // Backup player who helped
  backupDeaths: number; // Deaths by backup player
  playerNoShow: boolean; // Did primary player not show up?
  replacedByPlayerId: string; // Player who replaced no-show
  status: 'not-started' | 'in-progress' | 'completed';
  notes: string;
}

export interface Boss {
  id: string;
  nodeNumber: number; // 50
  name: string; // "Final Boss"
  assignedPlayerId: string; // Primary player assigned
  primaryDeaths: number; // Deaths by primary player
  backupHelped: boolean; // Did a backup player help?
  backupPlayerId: string; // Backup player who helped
  backupDeaths: number; // Deaths by backup player
  playerNoShow: boolean; // Did primary player not show up?
  replacedByPlayerId: string; // Player who replaced no-show
  status: 'not-started' | 'in-progress' | 'completed';
  notes: string;
}

export interface Battlegroup {
  bgNumber: number; // 1, 2, or 3 (for display)
  paths: Path[]; // 9 paths (nodes 1-36, grouped as paths)
  miniBosses: MiniBoss[]; // 13 mini bosses (nodes 37-49)
  boss: Boss; // 1 final boss (node 50)
  attackBonus: number; // Current attack bonus earned
  maxAttackBonus: number; // Maximum possible (13,500)
  pointsPerDeath: number; // Points lost per death
  totalKills: number; // Total kills in this BG
  defenderKills: number; // Defender kills
  exploration: number; // Exploration percentage (0-100)
  players: string[]; // Array of player IDs assigned to this BG
}

export interface War {
  id: string;
  name: string;
  startDate?: string; // War start date
  allianceResult?: 'win' | 'loss' | 'pending'; // War outcome
  battlegroups: Battlegroup[]; // Always 3 battlegroups
  seasonId?: string; // Season this war belongs to
}

export interface Season {
  id: string;
  name: string; // e.g., "Season 1", "December 2025"
  startDate: string; // Season start date
  endDate?: string; // Season end date (if completed)
  warIds: string[]; // IDs of wars in this season
  isActive: boolean; // Currently active season?
}

export interface PlayerPerformance {
  id: string;
  playerId: string;
  warId: string;
  seasonId: string;
  pathFights: number; // Path fights in this war
  mbFights: number; // Mini boss fights in this war
  bossFights: number; // Boss fights in this war
  totalFights: number; // Total fights in this war
  pathDeaths: number; // Deaths from path fights
  mbDeaths: number; // Deaths from mini boss fights
  bossDeaths: number; // Deaths from boss fights
  totalDeaths: number; // Total deaths in this war
  averageDeathsPerFight: number; // Avg deaths per fight
  perfectClears: number; // Fights with 0 deaths
  backupAssists: number; // Times helped as backup
  noShowCovers: number; // Times covered a no-show
}

export interface AllianceData {
  allianceName: string;
  allianceTag: string;
  wars: War[];
  players: Player[];
  seasons: Season[]; // Seasons to group wars
  playerPerformances: PlayerPerformance[]; // Per-war performance tracking
  currentWarIndex: number;
  currentSeasonId?: string; // Current active season
}

// Helper type for attack bonus calculation
export interface AttackBonusBreakdown {
  pathsBonus: number; // Total from all 9 paths
  miniBossesBonus: number; // Total from all 13 mini bosses
  bossBonus: number; // Total from final boss
  total: number; // Sum of all bonuses
}

// Helper type for player statistics
export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalPathFights: number;
  totalMbFights: number;
  totalFights: number; // pathFights + mbFights
  totalDeaths: number;
  averageDeathsPerFight: number;
  warsParticipated: number;
  perfectClears: number; // Fights with 0 deaths
}

// Helper type for war comparison
export interface WarStats {
  warId: string;
  warName: string;
  totalAttackBonus: number; // Sum across all 3 BGs
  totalDeaths: number;
  totalKills: number;
  avgAttackBonusPerBg: number;
  completionPercentage: number;
}