/**
 * migrateData.ts
 *
 * One-time Firebase migration utility.
 * Reads every alliance's data, cleans it with normaliseAllianceData,
 * and writes it back. Safe to re-run — all operations are idempotent.
 *
 * USAGE (run from the browser console or a migration page):
 *
 *   import { runMigration } from '@/lib/migrateData';
 *   await runMigration('YOUR_LEADER_KEY');
 *
 * What it fixes:
 *   1. Backfills season.warIds from war.seasonId
 *   2. Normalises 'draw' → 'tie' in allianceResult
 *   3. Sets section (1|2) on every path record
 *   4. Ensures every battlegroup has a boss node
 *   5. Ensures every battlegroup has exactly 13 mini bosses and 18 paths
 *   6. Sets maxAttackBonus to the correct 63,230
 *   7. Strips the deprecated battlegroup.players[] field
 *   8. Sets pathAssignmentMode default if missing
 */

import { ref, get, set } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebase';
import { normaliseAllianceData } from '@/lib/normaliseData';

export interface MigrationResult {
  success: boolean;
  key: string;
  changes: string[];
  error?: string;
}

/**
 * Runs the migration for a single alliance key.
 * Returns a detailed result so you can review what changed.
 */
export async function runMigration(leaderKey: string): Promise<MigrationResult> {
  const changes: string[] = [];

  try {
    const db = getFirebaseDatabase();
    const dataRef = ref(db, `alliances/${leaderKey}`);
    const snapshot = await get(dataRef);

    if (!snapshot.exists()) {
      return { success: false, key: leaderKey, changes, error: 'Alliance not found' };
    }

    const raw = snapshot.val();

    // Skip officer key pointers (they have isOfficerKey: true)
    if (raw?.isOfficerKey === true) {
      return { success: true, key: leaderKey, changes: ['Skipped — officer key pointer'] };
    }

    // Track specific changes for the report
    const wars = Array.isArray(raw.wars) ? raw.wars : [];

    // 1. Detect draw → tie
    const drawCount = wars.filter((w: any) => w.allianceResult === 'draw').length;
    if (drawCount > 0) changes.push(`Normalised ${drawCount} 'draw' results → 'tie'`);

    // 2. Detect missing section fields
    let missingSectionCount = 0;
    wars.forEach((w: any) => {
      (w.battlegroups ?? []).forEach((bg: any) => {
        (bg.paths ?? []).forEach((p: any) => {
          if (p.section == null) missingSectionCount++;
        });
      });
    });
    if (missingSectionCount > 0) changes.push(`Set section on ${missingSectionCount} path records`);

    // 3. Detect missing boss nodes
    let missingBossCount = 0;
    wars.forEach((w: any) => {
      (w.battlegroups ?? []).forEach((bg: any) => {
        if (!bg.boss) missingBossCount++;
      });
    });
    if (missingBossCount > 0) changes.push(`Created ${missingBossCount} missing boss nodes`);

    // 4. Detect warIds that need backfilling
    const seasons = Array.isArray(raw.seasons) ? raw.seasons : [];
    let backfilledSeasonCount = 0;
    seasons.forEach((s: any) => {
      if (!Array.isArray(s.warIds) || s.warIds.length === 0) {
        const derived = wars.filter((w: any) => w.seasonId === s.id);
        if (derived.length > 0) backfilledSeasonCount++;
      }
    });
    if (backfilledSeasonCount > 0) changes.push(`Backfilled warIds for ${backfilledSeasonCount} seasons`);

    // 5. Detect wrong maxAttackBonus
    let wrongBonusCount = 0;
    wars.forEach((w: any) => {
      (w.battlegroups ?? []).forEach((bg: any) => {
        if (bg.maxAttackBonus != null && bg.maxAttackBonus !== 63230) wrongBonusCount++;
      });
    });
    if (wrongBonusCount > 0) changes.push(`Corrected maxAttackBonus on ${wrongBonusCount} battlegroups → 63,230`);

    // 6. Detect deprecated players[] field on battlegroups
    let deprecatedPlayersCount = 0;
    wars.forEach((w: any) => {
      (w.battlegroups ?? []).forEach((bg: any) => {
        if (Array.isArray(bg.players) && bg.players.length > 0) deprecatedPlayersCount++;
      });
    });
    if (deprecatedPlayersCount > 0) changes.push(`Cleared deprecated players[] from ${deprecatedPlayersCount} battlegroups`);

    // Apply full normalisation
    const normalised = normaliseAllianceData(raw);

    // Write back
    await set(dataRef, normalised);

    if (changes.length === 0) {
      changes.push('No changes needed — data was already clean');
    }

    return { success: true, key: leaderKey, changes };

  } catch (err: any) {
    return {
      success: false,
      key: leaderKey,
      changes,
      error: err?.message ?? String(err),
    };
  }
}

/**
 * React hook version — returns a function you can call from a UI button.
 * Shows an alert with the results when done.
 *
 * Usage in a leader-only settings panel:
 *   const migrate = useMigration(allianceKey);
 *   <button onClick={migrate}>Run Data Migration</button>
 */
export function useMigration(leaderKey: string) {
  return async () => {
    const result = await runMigration(leaderKey);
    if (result.success) {
      alert(
        `✅ Migration complete for ${leaderKey}\n\n` +
        result.changes.map(c => `• ${c}`).join('\n')
      );
    } else {
      alert(`❌ Migration failed: ${result.error}`);
    }
  };
}