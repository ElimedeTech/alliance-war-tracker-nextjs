/**
 * normaliseData.ts
 *
 * Runtime validation and normalisation layer applied to every Firebase read.
 * TypeScript types are compile-time only — they offer no protection against
 * malformed or legacy data coming back from Firebase at runtime.
 *
 * This module is the single defensive boundary between raw Firebase data and
 * the rest of the app. Every field is given an explicit default so downstream
 * components never receive undefined/null where a value is expected.
 *
 * Rules:
 *  - Never throw — always return a valid object.
 *  - Never mutate the input — always return a new object.
 *  - Prefer data-preserving coercions (String(), Number()) over silent drops.
 */

import {
  AllianceData, War, Battlegroup, Path, MiniBoss, Boss,
  Player, Season, BgColors, DEFAULT_BG_COLORS,
} from '@/types';

// ─── Primitives ───────────────────────────────────────────────────────────────

const safeStr  = (v: any, fallback = ''): string  => (v != null && typeof v !== 'object') ? String(v)  : fallback;
const safeNum  = (v: any, fallback = 0):  number  => { const n = Number(v); return isFinite(n) ? n : fallback; };
const safeBool = (v: any, fallback = false): boolean => v != null ? Boolean(v) : fallback;
const safeArr  = <T>(v: any, mapFn: (x: any, i: number) => T): T[] =>
  Array.isArray(v) ? v.map(mapFn) : [];

// ─── Path ─────────────────────────────────────────────────────────────────────

function normalisePath(raw: any, index: number): Path {
  // Infer section from index when the field is missing
  const inferredSection: 1 | 2 = raw?.section === 2 ? 2 : index >= 9 ? 2 : 1;
  const inferredPathNumber: number = raw?.pathNumber ?? (index % 9) + 1;

  return {
    id:                 safeStr(raw?.id, `path-${inferredPathNumber}-${inferredSection}-${index}`),
    pathNumber:         safeNum(raw?.pathNumber, inferredPathNumber),
    section:            inferredSection,
    assignedPlayerId:   safeStr(raw?.assignedPlayerId),
    assignedPlayerName: safeStr(raw?.assignedPlayerName),
    primaryDeaths:      safeNum(raw?.primaryDeaths, 0),
    backupHelped:       safeBool(raw?.backupHelped),
    backupPlayerId:     safeStr(raw?.backupPlayerId),
    backupFights:       raw?.backupFights != null ? safeNum(raw.backupFights, 1) : undefined,
    backupDeaths:       safeNum(raw?.backupDeaths, 0),
    playerNoShow:       safeBool(raw?.playerNoShow),
    replacedByPlayerId: safeStr(raw?.replacedByPlayerId),
    status:             (['not-started', 'in-progress', 'completed'].includes(raw?.status)
                          ? raw.status : 'not-started') as Path['status'],
    noDefender:         raw?.noDefender != null ? safeBool(raw.noDefender) : undefined,
    notes:              safeStr(raw?.notes),
  };
}

// ─── MiniBoss ─────────────────────────────────────────────────────────────────

function normaliseMiniBoss(raw: any, index: number): MiniBoss {
  const nodeNumber = safeNum(raw?.nodeNumber, 37 + index);

  return {
    id:                 safeStr(raw?.id, `mb-${nodeNumber}-${index}`),
    nodeNumber,
    name:               safeStr(raw?.name, `Mini Boss ${index + 1}`),
    assignedPlayerId:   safeStr(raw?.assignedPlayerId),
    assignedPlayerName: safeStr(raw?.assignedPlayerName),
    primaryDeaths:      safeNum(raw?.primaryDeaths, 0),
    backupHelped:       safeBool(raw?.backupHelped),
    backupPlayerId:     safeStr(raw?.backupPlayerId),
    backupDeaths:       safeNum(raw?.backupDeaths, 0),
    playerNoShow:       safeBool(raw?.playerNoShow),
    replacedByPlayerId: safeStr(raw?.replacedByPlayerId),
    status:             (['not-started', 'in-progress', 'completed'].includes(raw?.status)
                          ? raw.status : 'not-started') as MiniBoss['status'],
    noDefender:         raw?.noDefender != null ? safeBool(raw.noDefender) : undefined,
    notes:              safeStr(raw?.notes),
  };
}

// ─── Boss ─────────────────────────────────────────────────────────────────────

function normaliseBoss(raw: any): Boss {
  return {
    id:                 safeStr(raw?.id, `boss-50`),
    nodeNumber:         safeNum(raw?.nodeNumber, 50),
    name:               safeStr(raw?.name, 'Final Boss'),
    assignedPlayerId:   safeStr(raw?.assignedPlayerId),
    assignedPlayerName: safeStr(raw?.assignedPlayerName),
    primaryDeaths:      safeNum(raw?.primaryDeaths, 0),
    backupHelped:       safeBool(raw?.backupHelped),
    backupPlayerId:     safeStr(raw?.backupPlayerId),
    backupDeaths:       safeNum(raw?.backupDeaths, 0),
    playerNoShow:       safeBool(raw?.playerNoShow),
    replacedByPlayerId: safeStr(raw?.replacedByPlayerId),
    status:             (['not-started', 'in-progress', 'completed'].includes(raw?.status)
                          ? raw.status : 'not-started') as Boss['status'],
    noDefender:         raw?.noDefender != null ? safeBool(raw.noDefender) : undefined,
    notes:              safeStr(raw?.notes),
  };
}

// ─── Battlegroup ──────────────────────────────────────────────────────────────

function normaliseBattlegroup(raw: any, bgIndex: number): Battlegroup {
  const paths: Path[] = Array.isArray(raw?.paths)
    ? raw.paths.map((p: any, i: number) => normalisePath(p, i))
    : [];

  // Ensure exactly 18 path records (9 sec-1 + 9 sec-2)
  const normalisedPaths: Path[] = Array.from({ length: 18 }, (_, i) =>
    paths[i] ?? normalisePath(undefined, i)
  );

  const miniBosses: MiniBoss[] = Array.isArray(raw?.miniBosses)
    ? raw.miniBosses.map((m: any, i: number) => normaliseMiniBoss(m, i))
    : Array.from({ length: 13 }, (_, i) => normaliseMiniBoss(undefined, i));

  // Ensure exactly 13 mini bosses
  const normalisedMbs: MiniBoss[] = Array.from({ length: 13 }, (_, i) =>
    miniBosses[i] ?? normaliseMiniBoss(undefined, i)
  );

  return {
    bgNumber:       safeNum(raw?.bgNumber, bgIndex + 1),
    paths:          normalisedPaths,
    miniBosses:     normalisedMbs,
    boss:           normaliseBoss(raw?.boss),
    attackBonus:    safeNum(raw?.attackBonus, 0),
    maxAttackBonus: 63230, // Always use the correct value
    pointsPerDeath: safeNum(raw?.pointsPerDeath, 0),
    totalKills:     safeNum(raw?.totalKills, 0),
    defenderKills:  safeNum(raw?.defenderKills, 0),
    exploration:    safeNum(raw?.exploration, 0),
    players:        [], // Deprecated — membership is from Player.bgAssignment
  };
}

// ─── War ──────────────────────────────────────────────────────────────────────

function normaliseWar(raw: any): War {
  // Normalise tie/draw inconsistency
  let result = raw?.allianceResult;
  if (result === 'draw') result = 'tie';
  if (!['win', 'loss', 'tie', 'pending'].includes(result)) result = 'pending';

  return {
    id:             safeStr(raw?.id, `war-${Date.now()}`),
    name:           safeStr(raw?.name, 'War'),
    startDate:      raw?.startDate ? safeStr(raw.startDate) : undefined,
    endDate:        raw?.endDate   ? safeStr(raw.endDate)   : undefined,
    allianceResult: result,
    isClosed:       safeBool(raw?.isClosed),
    battlegroups:   Array.isArray(raw?.battlegroups) && raw.battlegroups.length >= 3
                      ? raw.battlegroups.slice(0, 3).map((bg: any, i: number) => normaliseBattlegroup(bg, i))
                      : [0, 1, 2].map(i => normaliseBattlegroup(raw?.battlegroups?.[i], i)),
    seasonId:       raw?.seasonId ? safeStr(raw.seasonId) : undefined,
    opponentName:   raw?.opponentName ? safeStr(raw.opponentName) : undefined,
  };
}

// ─── Player ───────────────────────────────────────────────────────────────────

export function normalisePlayer(raw: any): Player {
  return {
    id:               safeStr(raw?.id, `player-${Date.now()}-${Math.random()}`),
    name:             safeStr(raw?.name, 'Unknown'),
    bgAssignment:     safeNum(raw?.bgAssignment, -1),
    pathFights:       safeNum(raw?.pathFights, 0),
    mbFights:         safeNum(raw?.mbFights, 0),
    totalDeaths:      safeNum(raw?.totalDeaths, 0),
    warsParticipated: safeNum(raw?.warsParticipated, 0),
    seasonStats:      raw?.seasonStats ?? undefined,
  };
}

// ─── Season ───────────────────────────────────────────────────────────────────

function normaliseSeason(raw: any): Season {
  return {
    id:           safeStr(raw?.id, `season-${Date.now()}`),
    name:         safeStr(raw?.name, 'Season'),
    seasonNumber: raw?.seasonNumber ? safeNum(raw.seasonNumber) : undefined,
    startDate:    safeStr(raw?.startDate, new Date().toISOString().split('T')[0]),
    endDate:      raw?.endDate ? safeStr(raw.endDate) : undefined,
    warIds:       safeArr(raw?.warIds, (x) => safeStr(x)),
    isActive:     safeBool(raw?.isActive),
  };
}

// ─── BgColors ─────────────────────────────────────────────────────────────────

function normaliseBgColors(raw: any): BgColors {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_BG_COLORS };
  // Validate hex colour strings; fall back to defaults for invalid values
  const hexRe = /^#[0-9a-fA-F]{3,8}$/;
  return {
    1: hexRe.test(raw[1]) ? raw[1] : DEFAULT_BG_COLORS[1],
    2: hexRe.test(raw[2]) ? raw[2] : DEFAULT_BG_COLORS[2],
    3: hexRe.test(raw[3]) ? raw[3] : DEFAULT_BG_COLORS[3],
  };
}

// ─── AllianceData (top-level entry point) ────────────────────────────────────

export function normaliseAllianceData(raw: any): AllianceData {
  if (!raw || typeof raw !== 'object') {
    throw new Error('normaliseAllianceData: received null or non-object data from Firebase');
  }

  const wars    = safeArr(raw.wars,            normaliseWar);
  const seasons = safeArr(raw.seasons,         normaliseSeason);

  // Auto-backfill season.warIds from war.seasonId for pre-warIds legacy data.
  // This runs on every read so the data self-heals without a one-time migration.
  const backfilledSeasons = seasons.map(season => {
    if (season.warIds.length > 0) return season; // Already populated — trust it
    const derived = wars
      .filter(w => w.seasonId === season.id)
      .map(w => w.id);
    return derived.length > 0 ? { ...season, warIds: derived } : season;
  });

  return {
    allianceName:       safeStr(raw.allianceName, 'My Alliance'),
    allianceTag:        safeStr(raw.allianceTag),
    wars,
    players:            safeArr(raw.players,         normalisePlayer),
    archivedPlayers:    safeArr(raw.archivedPlayers,  normalisePlayer),
    seasons:            backfilledSeasons,
    playerPerformances: safeArr(raw.playerPerformances, (x) => x), // Passthrough
    currentWarIndex:    safeNum(raw.currentWarIndex, 0),
    currentSeasonId:    raw.currentSeasonId ? safeStr(raw.currentSeasonId) : undefined,
    bgColors:           raw.bgColors ? normaliseBgColors(raw.bgColors) : undefined,
    pathAssignmentMode: raw.pathAssignmentMode === 'single' ? 'single' : 'split',
    officerKey:         raw.officerKey ? safeStr(raw.officerKey) : undefined,
  };
}