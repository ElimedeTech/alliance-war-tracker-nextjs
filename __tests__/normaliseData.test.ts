/// <reference types="jest" />
import { normaliseAllianceData, normalisePlayer } from '../lib/normaliseData';

// ─── normalisePlayer ──────────────────────────────────────────────────────────

describe('normalisePlayer', () => {
  it('sets numeric defaults for missing fields', () => {
    const p = normalisePlayer({ id: 'x', name: 'Test', bgAssignment: 0 });
    expect(p.pathFights).toBe(0);
    expect(p.totalDeaths).toBe(0);
    expect(p.warsParticipated).toBe(0);
  });

  it('preserves valid existing values', () => {
    const p = normalisePlayer({ id: 'x', name: 'Test', bgAssignment: 1, totalDeaths: 5 });
    expect(p.totalDeaths).toBe(5);
  });

  it('coerces string numbers', () => {
    const p = normalisePlayer({ id: 'x', name: 'Test', bgAssignment: '2', totalDeaths: '3' });
    expect(p.bgAssignment).toBe(2);
    expect(p.totalDeaths).toBe(3);
  });
});

// ─── normaliseAllianceData ────────────────────────────────────────────────────

describe('normaliseAllianceData', () => {
  const minimal = {
    allianceName: 'Test',
    wars: [],
    players: [],
    seasons: [],
    playerPerformances: [],
    currentWarIndex: 0,
  };

  it('throws on null input', () => {
    expect(() => normaliseAllianceData(null)).toThrow();
  });

  it('returns valid data for minimal input', () => {
    const result = normaliseAllianceData(minimal);
    expect(result.allianceName).toBe('Test');
    expect(result.wars).toHaveLength(0);
    expect(result.players).toHaveLength(0);
  });

  it('defaults pathAssignmentMode to split', () => {
    const result = normaliseAllianceData(minimal);
    expect(result.pathAssignmentMode).toBe('split');
  });

  it('preserves single pathAssignmentMode', () => {
    const result = normaliseAllianceData({ ...minimal, pathAssignmentMode: 'single' });
    expect(result.pathAssignmentMode).toBe('single');
  });

  it('normalises draw → tie in war results', () => {
    const withDraw = {
      ...minimal,
      wars: [{ id: 'w1', name: 'W1', battlegroups: [], allianceResult: 'draw' }],
    };
    const result = normaliseAllianceData(withDraw);
    expect(result.wars[0].allianceResult).toBe('tie');
  });

  it('sets maxAttackBonus to 63230 regardless of stored value', () => {
    const withWrongBonus = {
      ...minimal,
      wars: [{
        id: 'w1', name: 'W1', allianceResult: 'win',
        battlegroups: [
          { bgNumber: 1, maxAttackBonus: 72950, paths: [], miniBosses: [], boss: null },
          { bgNumber: 2, maxAttackBonus: 72950, paths: [], miniBosses: [], boss: null },
          { bgNumber: 3, maxAttackBonus: 72950, paths: [], miniBosses: [], boss: null },
        ],
      }],
    };
    const result = normaliseAllianceData(withWrongBonus);
    result.wars[0].battlegroups.forEach(bg => {
      expect(bg.maxAttackBonus).toBe(63230);
    });
  });

  it('backfills warIds from war.seasonId', () => {
    const withSeasonId = {
      ...minimal,
      wars: [{ id: 'w1', name: 'W1', battlegroups: [], allianceResult: 'win', seasonId: 'season-1' }],
      seasons: [{ id: 'season-1', name: 'Season 1', warIds: [], startDate: '2025-01-01', isActive: true }],
    };
    const result = normaliseAllianceData(withSeasonId);
    expect(result.seasons[0].warIds).toContain('w1');
  });

  it('does not overwrite existing warIds', () => {
    const withExistingWarIds = {
      ...minimal,
      wars: [{ id: 'w1', name: 'W1', battlegroups: [], allianceResult: 'win', seasonId: 'season-1' }],
      seasons: [{ id: 'season-1', name: 'Season 1', warIds: ['w1', 'w2'], startDate: '2025-01-01', isActive: true }],
    };
    const result = normaliseAllianceData(withExistingWarIds);
    // Should keep original warIds, not replace with just ['w1']
    expect(result.seasons[0].warIds).toContain('w2');
  });

  it('infers path section from index when missing', () => {
    const paths = Array.from({ length: 18 }, (_, i) => ({
      id: `p${i}`, pathNumber: (i % 9) + 1,
      // deliberately omit section
      assignedPlayerId: '', primaryDeaths: 0,
      backupHelped: false, backupPlayerId: '', backupDeaths: 0,
      playerNoShow: false, replacedByPlayerId: '',
      status: 'not-started', notes: '',
    }));
    const withPaths = {
      ...minimal,
      wars: [{
        id: 'w1', name: 'W1', allianceResult: 'win',
        battlegroups: [
          { bgNumber: 1, paths, miniBosses: [], boss: null },
          { bgNumber: 2, paths: [], miniBosses: [], boss: null },
          { bgNumber: 3, paths: [], miniBosses: [], boss: null },
        ],
      }],
    };
    const result = normaliseAllianceData(withPaths);
    const bg1Paths = result.wars[0].battlegroups[0].paths;
    // First 9 should be section 1, last 9 should be section 2
    expect(bg1Paths[0].section).toBe(1);
    expect(bg1Paths[9].section).toBe(2);
  });
});