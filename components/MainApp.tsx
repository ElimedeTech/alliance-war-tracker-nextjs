'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ref, set, onValue, off } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebase';
import { AllianceData, War, Player, Season } from '@/types';
import { calculatePlayerWarPerformance, updatePlayerAggregateStats } from '@/lib/performanceCalculator';
import Header from './Header';
import WarManagement from './WarManagement';
import PlayerManagement from './PlayerManagement';
import PathAssignmentModal from './PathAssignmentModal';
import BattlegroupTabs from './BattlegroupTabs';
import EnhancedBattlegroupContent from './EnhancedBattlegroupContent';
import StatsModal from './StatsModal';
import WarComparisonDashboard from './WarComparisonDashboard';
import SeasonManagement from './SeasonManagement';

interface MainAppProps {
  allianceKey: string;
  initialData: AllianceData;
  userRole: 'leader' | 'officer';
  onLogout?: () => void;
}

export default function MainApp({ allianceKey, initialData, userRole, onLogout }: MainAppProps) {
  const router = useRouter();
  
  // Migration: Ensure all paths have section property
  const migrateData = (data: AllianceData): AllianceData => {
    const createMissingPath = (pathNumber: number, section: 2) => ({
      id: `path-${pathNumber}-${section}-${Date.now()}-${Math.random()}`,
      pathNumber: pathNumber,
      section: section,
      assignedPlayerId: '',
      primaryDeaths: 0,
      backupHelped: false,
      backupPlayerId: '',
      backupDeaths: 0,
      playerNoShow: false,
      replacedByPlayerId: '',
      status: 'not-started' as const,
      notes: '',
    });

    return {
      ...data,
      wars: (data.wars || []).map(war => ({
        ...war,
        battlegroups: war.battlegroups.map((bg, bgIdx) => {
          // First, set section property on existing paths
          let updatedPaths = (bg.paths || []).map((path, pathIdx) => ({
            ...path,
            section: path.section || (pathIdx < 9 ? 1 : 2),
          }));

          // Then, add missing Section 2 paths if they don't exist
          if (updatedPaths.length < 18) {
            const section2Paths = updatedPaths.filter((p: any) => p.section === 2);
            if (section2Paths.length === 0) {
              // Add all 9 Section 2 paths
              updatedPaths = [
                ...updatedPaths,
                ...Array.from({ length: 9 }, (_, i) => createMissingPath(i + 1, 2)),
              ];
            }
          }

          return {
            ...bg,
            paths: updatedPaths,
          };
        }),
      })),
    };
  };

  const migratedData = migrateData(initialData);
  const [data, setData] = useState<AllianceData>(migratedData);
  const [currentWarIndex, setCurrentWarIndex] = useState(initialData.currentWarIndex || 0);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [showStats, setShowStats] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showWarComparison, setShowWarComparison] = useState(false);
  const [showSeasonManagement, setShowSeasonManagement] = useState(false);
  const [showPathAssignment, setShowPathAssignment] = useState(false);

  // Firebase real-time sync
  useEffect(() => {
    const db = getFirebaseDatabase();
    const dataRef = ref(db, `alliances/${allianceKey}`);

    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const newData = snapshot.val();
        setData(migrateData(newData));
        setSyncStatus('synced');
      }
    }, (error) => {
      console.error('Firebase sync error:', error);
      setSyncStatus('error');
    });

    return () => {
      off(dataRef);
    };
  }, [allianceKey]);

  const saveToFirebase = useCallback(async (updatedData: AllianceData) => {
    try {
      setSyncStatus('syncing');
      const db = getFirebaseDatabase();
      const dataRef = ref(db, `alliances/${allianceKey}`);
      await set(dataRef, updatedData);
      
      setSaveMessage('✅ Saved');
      setTimeout(() => setSaveMessage(''), 2000);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Save error:', error);
      setSyncStatus('error');
      setSaveMessage('❌ Save failed');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [allianceKey]);

  const updateData = useCallback((updates: Partial<AllianceData>) => {
    const updatedData = { ...data, ...updates };
    setData(updatedData);
    saveToFirebase(updatedData);
  }, [data, saveToFirebase]);

  const updateCurrentWar = useCallback((warUpdates: Partial<War>) => {
    const wars = data.wars && Array.isArray(data.wars) && data.wars.length > 0 ? data.wars : [];
    if (wars.length === 0) return;
    
    const warIndex = Math.min(currentWarIndex, wars.length - 1);
    const updatedWars = [...wars];
    updatedWars[warIndex] = { ...updatedWars[warIndex], ...warUpdates };
    updateData({ wars: updatedWars });
  }, [data.wars, currentWarIndex, updateData]);

  const handleAddWar = () => {
    const wars = data.wars && Array.isArray(data.wars) && data.wars.length > 0 ? data.wars : [];
    const seasons = data.seasons && Array.isArray(data.seasons) && data.seasons.length > 0 ? data.seasons : [];
    
    // Ensure there's at least one active season
    let currentSeasonId = data.currentSeasonId;
    let updatedSeasons = seasons;
    
    if (!currentSeasonId || !seasons.find(s => s.id === currentSeasonId)) {
      // Create a default season if none exists
      const defaultSeason: Season = {
        id: `season-${Date.now()}`,
        name: `Season 1`,
        startDate: new Date().toISOString().split('T')[0],
        warIds: [],
        isActive: true,
      };
      updatedSeasons = [defaultSeason];
      currentSeasonId = defaultSeason.id;
    }
    
    // V2.5 Enhanced: Path-level player assignment (no nodes)
    const createEmptyPath = (pathNumber: number, section: 1 | 2) => ({
      id: `path-${pathNumber}-${section}-${Date.now()}-${Math.random()}`,
      pathNumber: pathNumber,
      section: section,
      assignedPlayerId: '',
      primaryDeaths: 0,
      backupHelped: false,
      backupPlayerId: '',
      backupDeaths: 0,
      playerNoShow: false,
      replacedByPlayerId: '',
      status: 'not-started' as const,
      notes: '',
    });

    // V2.5 Enhanced: Mini Boss with backup player tracking
    const createMiniBoss = (nodeNumber: number, mbNumber: number) => ({
      id: `miniboss-${nodeNumber}-${Date.now()}-${Math.random()}`,
      nodeNumber: nodeNumber,
      name: `Mini Boss ${mbNumber}`,
      assignedPlayerId: '',
      primaryDeaths: 0,
      backupHelped: false,
      backupPlayerId: '',
      backupDeaths: 0,
      playerNoShow: false,
      replacedByPlayerId: '',
      status: 'not-started' as const,
      notes: '',
    });

    const newWar: War = {
      id: `war-${wars.length + 1}-${Date.now()}`,
      name: `War ${wars.length + 1}`,
      startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      allianceResult: 'pending', // Default to pending
      seasonId: currentSeasonId, // Assign to current season
      battlegroups: [1, 2, 3].map((bgNumber) => ({
        bgNumber: bgNumber, // BG1, BG2, BG3
        paths: [
          // Section 1: Paths 1-9
          ...Array.from({ length: 9 }, (_, i) => createEmptyPath(i + 1, 1)),
          // Section 2: Paths 1-9
          ...Array.from({ length: 9 }, (_, i) => createEmptyPath(i + 1, 2)),
        ],
        miniBosses: Array(13).fill(null).map((_, i) => createMiniBoss(37 + i, i + 1)),
        boss: {
          id: `boss-50-${Date.now()}-${Math.random()}`,
          nodeNumber: 50,
          name: 'Final Boss',
          assignedPlayerId: '',
          primaryDeaths: 0,
          backupHelped: false,
          backupPlayerId: '',
          backupDeaths: 0,
          playerNoShow: false,
          replacedByPlayerId: '',
          status: 'not-started' as const,
          notes: '',
        },
        attackBonus: 13500, // Max bonus (9 paths × 1,080 + 13 MBs × 270 + 1 boss × 50,000)
        maxAttackBonus: 72950, // Max bonus: 18 paths × 1,080 + 13 MBs × 270 + boss × 50,000
        pointsPerDeath: 0, // Track points lost per death
        totalKills: 0, // Track total defender kills
        defenderKills: 0, // Track defender kills
        exploration: 100, // Exploration percentage (default 100%)
        players: data.players
          ?.filter(p => p.bgAssignment === (bgNumber - 1)) // Filter by 0-indexed bgAssignment
          .map(p => p.id) || [],
      })),
    };

    const updatedWars = [...wars, newWar];
    
    // Add war to current season
    const updatedSeasonsWithWar = updatedSeasons.map(s =>
      s.id === currentSeasonId
        ? { ...s, warIds: [...s.warIds, newWar.id] }
        : s
    );
    
    setCurrentWarIndex(updatedWars.length - 1);
    setCurrentBgIndex(0);
    updateData({ 
      wars: updatedWars, 
      seasons: updatedSeasonsWithWar,
      currentWarIndex: updatedWars.length - 1,
      currentSeasonId,
    });
  };

  const handleDeleteWar = (warIndex: number) => {
    const wars = data.wars && Array.isArray(data.wars) && data.wars.length > 0 ? data.wars : [];
    
    if (wars.length === 1) {
      alert('Cannot delete the last war!');
      return;
    }

    // Confirmation is now handled in WarManagement component
    const updatedWars = wars.filter((_, index) => index !== warIndex);
    const newIndex = Math.max(0, Math.min(warIndex, updatedWars.length - 1));
    setCurrentWarIndex(newIndex);
    updateData({ wars: updatedWars, currentWarIndex: newIndex });
  };

  const handleSwitchWar = (index: number) => {
    setCurrentWarIndex(index);
    setCurrentBgIndex(0);
    updateData({ currentWarIndex: index });
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?key=${allianceKey}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        alert(`✅ Link copied!\n\n${link}\n\nShare this with your officers!\n\n💡 The alliance key is in the URL - they just click and connect!`);
      });
    } else {
      prompt('Copy this link:', link);
    }
  };

  const verifyAllianceKey = () => {
    const wars = data.wars && Array.isArray(data.wars) && data.wars.length > 0 ? data.wars : [];
    const keyPreview = allianceKey.substring(0, 20) + '...';
    alert(
      `🔑 Alliance Key Verification\n\n` +
      `Key: ${keyPreview}\n\n` +
      `✅ All officers must use the EXACT same key to see the same data!\n\n` +
      `💡 If officers can't see your data:\n` +
      `1. Click "Share Link" and send them the link\n` +
      `2. Or have them enter this exact key when connecting\n\n` +
      `📊 Total Wars: ${wars.length}\n` +
      `👥 Total Players: ${data.players?.length || 0}\n` +
      `⏰ Last Updated: ${new Date().toLocaleTimeString()}`
    );
  };

  // Recalculate player performance for all wars when data changes
  // REMOVED: This was causing infinite loops. Stats will be calculated on-demand when viewing stats modal
  // If you need auto-calculation, implement it differently to avoid dependency loops

  // Safety check for wars array
  const safeWars = data.wars && Array.isArray(data.wars) && data.wars.length > 0 ? data.wars : [];
  const safeWarIndex = safeWars.length > 0 ? Math.min(currentWarIndex, safeWars.length - 1) : 0;
  
  const currentWar = safeWars[safeWarIndex];
  const currentBg = currentWar?.battlegroups?.[currentBgIndex];

  // If no wars exist, show a welcome screen with player management
  if (!currentWar) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <Header
          allianceName={data.allianceName}
          allianceTag={data.allianceTag}
          syncStatus={syncStatus}
          saveMessage={saveMessage}
          userRole={userRole}
          onVerifyKey={verifyAllianceKey}
          onShareLink={copyShareLink}
          onChangeAlliance={() => {
            onLogout?.();
            router.push('/');
          }}
          onShowStats={() => setShowStats(true)}
          onShowPlayerManagement={() => setShowPlayerManagement(true)}
          onShowWarComparison={() => setShowWarComparison(true)}
          onShowSeasonManagement={() => setShowSeasonManagement(true)}
        />

        <div className="bg-gradient-to-b from-purple-900/30 to-slate-800 rounded-lg p-8 mb-8 border border-purple-500/30">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome to your Alliance!</h1>
            <p className="text-gray-300 text-lg">Get started by managing your players</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-green-500/30">
              <h2 className="text-2xl font-bold text-green-400 mb-3">👥 Add Your Players</h2>
              <p className="text-gray-300 mb-4">
                Start by adding your alliance members to the system. You can assign them to battlegroups and manage their information.
              </p>
              <button
                onClick={() => setShowPlayerManagement(true)}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition"
              >
                Manage Players Now
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-blue-500/30">
              <h2 className="text-2xl font-bold text-blue-400 mb-3">⚔️ Create Your First War</h2>
              <p className="text-gray-300 mb-4">
                Once your players are added, create your first war and start tracking battles. You can always add wars later.
              </p>
              <button
                onClick={handleAddWar}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
              >
                Create First War
              </button>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <p className="text-gray-300 text-center">
              <strong>💡 Tip:</strong> You can add players now and create wars whenever you're ready. Both managers are always available in the top menu!
            </p>
          </div>
        </div>

        {showPlayerManagement && (
          <PlayerManagement
            players={data.players || []}
            onClose={() => setShowPlayerManagement(false)}
            onUpdatePlayers={(players) => updateData({ players })}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Header
        allianceName={data.allianceName}
        allianceTag={data.allianceTag}
        syncStatus={syncStatus}
        saveMessage={saveMessage}
        userRole={userRole}
        onVerifyKey={verifyAllianceKey}
        onShareLink={copyShareLink}
        onChangeAlliance={() => {
          onLogout?.();
          router.push('/');
        }}
        onShowStats={() => setShowStats(true)}
        onShowPlayerManagement={() => setShowPlayerManagement(true)}
        onShowWarComparison={() => setShowWarComparison(true)}
        onShowSeasonManagement={() => setShowSeasonManagement(true)}
      />

      <WarManagement
        wars={safeWars}
        currentWarIndex={safeWarIndex}
        userRole={userRole}
        onAddWar={handleAddWar}
        onSwitchWar={handleSwitchWar}
        onDeleteWar={handleDeleteWar}
      />

      {showPlayerManagement && (
        <PlayerManagement
          players={data.players || []}
          onClose={() => setShowPlayerManagement(false)}
          onUpdatePlayers={(players) => updateData({ players })}
        />
      )}

      <div className="flex gap-3 mb-6 px-6">
        <button
          onClick={() => setShowPathAssignment(true)}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition"
          title="Assign players to paths, mini bosses, and boss"
        >
          🗺️ Assign Paths
        </button>
      </div>

      <BattlegroupTabs
        currentBgIndex={currentBgIndex}
        onSwitchBg={setCurrentBgIndex}
      />

      {currentBg && (
        <EnhancedBattlegroupContent
          battlegroup={currentBg}
          bgIndex={currentBgIndex}
          players={data.players || []}
          onUpdate={(bgUpdates) => {
            const updatedBgs = [...currentWar.battlegroups];
            updatedBgs[currentBgIndex] = { ...currentBg, ...bgUpdates };
            updateCurrentWar({ battlegroups: updatedBgs });
          }}
        />
      )}

      {showStats && (
        <StatsModal
          wars={safeWars}
          players={data.players || []}
          onClose={() => setShowStats(false)}
        />
      )}

      {showWarComparison && (
        <WarComparisonDashboard
          wars={safeWars}
          onClose={() => setShowWarComparison(false)}
        />
      )}

      {showSeasonManagement && (
        <SeasonManagement
          seasons={data.seasons || []}
          allWars={safeWars}
          currentSeasonId={data.currentSeasonId}
          onUpdateSeasons={(seasons, currentSeasonId) => {
            updateData({ 
              seasons, 
              currentSeasonId: currentSeasonId || data.currentSeasonId
            });
          }}
          onClose={() => setShowSeasonManagement(false)}
        />
      )}

      {showPathAssignment && currentWar && (
        <PathAssignmentModal
          isOpen={showPathAssignment}
          onClose={() => setShowPathAssignment(false)}
          war={currentWar}
          bgIndex={currentBgIndex}
          players={data.players || []}
          onUpdateWar={(updatedWar) => {
            const updatedWars = data.wars.map((w, idx) =>
              idx === currentWarIndex ? updatedWar : w
            );
            updateData({ wars: updatedWars });
          }}
        />
      )}
    </div>
  );
}