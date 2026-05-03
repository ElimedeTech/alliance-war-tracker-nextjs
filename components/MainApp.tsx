'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ref, set, onValue } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebase';
import { AllianceData, War, Player, Season } from '@/types';
import { calculatePlayerWarPerformance, updatePlayerAggregateStats } from '@/lib/performanceCalculator';
import { normaliseAllianceData, sanitiseForFirebase } from '@/lib/normaliseData';
import { getCountablePaths, fightsPerPathRecord } from '@/lib/calculations';
import { AppErrorBoundary, ModalErrorBoundary, BattlegroupErrorBoundary } from './ErrorBoundary';
import Header from './Header';
import WarManagement from './WarManagement';
import PlayerManagement from './PlayerManagement';
import PathAssignmentModal from './PathAssignmentModal';
import BattlegroupTabs from './BattlegroupTabs';
import EnhancedBattlegroupContent from './EnhancedBattlegroupContent';
import StatsModal from './StatsModal';
import WarComparisonDashboard from './WarComparisonDashboard';
import SeasonManagement from './SeasonManagement';
import { AllianceSettingsModal } from './AllianceSettingsModal';

interface MainAppProps {
  allianceKey: string;
  initialData: AllianceData;
  userRole: 'leader' | 'officer';
  onLogout?: () => void;
}

export default function MainApp({ allianceKey, initialData, userRole, onLogout }: MainAppProps) {
  const router = useRouter();

  const [data, setData] = useState<AllianceData>(() => {
    try { return normaliseAllianceData(initialData); } catch { return initialData; }
  });
  const [currentWarIndex, setCurrentWarIndex] = useState(initialData.currentWarIndex || 0);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [isOnline, setIsOnline] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showStats, setShowStats] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showWarComparison, setShowWarComparison] = useState(false);
  const [showSeasonManagement, setShowSeasonManagement] = useState(false);
  const [showPathAssignment, setShowPathAssignment] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Firebase real-time sync — apply normaliser on every read
  useEffect(() => {
    const db = getFirebaseDatabase();
    const dataRef = ref(db, `alliances/${allianceKey}`);

    // Monitor Firebase connection state for the offline indicator
    const connectedRef = ref(db, '.info/connected');
    const connUnsubscribe = onValue(connectedRef, (snap) => {
      setIsOnline(snap.val() === true);
    });

    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        try {
          const normalised = normaliseAllianceData(snapshot.val());
          setData(normalised);
          setSyncStatus('synced');
          setErrorMessage('');
        } catch (err: any) {
          console.error('normaliseAllianceData failed:', err);
          // Fall back to raw data rather than leaving stale state
          setData(snapshot.val());
          setSyncStatus('synced');
        }
      } else {
        setSyncStatus('error');
        setErrorMessage('Alliance data not found. Please check your connection key.');
      }
    }, (error: any) => {
      console.error('Firebase sync error:', error);
      setSyncStatus('error');
      if (error.code === 'PERMISSION_DENIED') {
        setErrorMessage('❌ Access denied. Please verify your alliance key.');
      } else if (error.code === 'NETWORK_ERROR') {
        setErrorMessage('❌ Network error. Retrying connection...');
      } else {
        setErrorMessage(`❌ Connection error: ${error.message || 'Unknown error'}`);
      }
    });

    return () => { unsubscribe(); connUnsubscribe(); };
  }, [allianceKey]);

  const saveToFirebase = useCallback(async (updatedData: AllianceData) => {
    try {
      setSyncStatus('syncing');
      const db = getFirebaseDatabase();
      const dataRef = ref(db, `alliances/${allianceKey}`);
      // sanitiseForFirebase strips undefined values — Firebase rejects any object containing them
      await set(dataRef, sanitiseForFirebase(updatedData));
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
    setData(prev => {
      const updatedData = { ...prev, ...updates };
      saveToFirebase(updatedData);
      return updatedData;
    });
  }, [saveToFirebase]);

  const updateCurrentWar = useCallback((warUpdates: Partial<War>) => {
    setData(prev => {
      const wars = prev.wars && Array.isArray(prev.wars) && prev.wars.length > 0 ? prev.wars : [];
      if (wars.length === 0) return prev;
      const warIndex = Math.min(currentWarIndex, wars.length - 1);
      const updatedWars = [...wars];
      updatedWars[warIndex] = { ...updatedWars[warIndex], ...warUpdates };
      const updatedData = { ...prev, wars: updatedWars };
      saveToFirebase(updatedData);
      return updatedData;
    });
  }, [currentWarIndex, saveToFirebase]);

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

    // Carry path assignments forward from the most recent war
    const previousWar = wars.length > 0 ? wars[wars.length - 1] : null;

    // War number resets to 1 at the start of each season
    const currentSeason = updatedSeasons.find(s => s.id === currentSeasonId);
    const warsInSeason = (currentSeason?.warIds || []).length;

    const newWar: War = {
      id: `war-${wars.length + 1}-${Date.now()}`,
      name: `War ${warsInSeason + 1}`,
      startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      allianceResult: 'pending', // Default to pending
      seasonId: currentSeasonId, // Assign to current season
      battlegroups: [1, 2, 3].map((bgNumber) => {
        const prevBg = previousWar?.battlegroups[bgNumber - 1];
        const createPathWithCarryover = (pathNumber: number, section: 1 | 2) => {
          const prevPath = prevBg?.paths.find(p => p.pathNumber === pathNumber && p.section === section);
          return {
            ...createEmptyPath(pathNumber, section),
            assignedPlayerId: prevPath?.assignedPlayerId || '',
            assignedPlayerName: prevPath?.assignedPlayerName || '', // ← carry name snapshot forward
          };
        };
        return {
          bgNumber: bgNumber, // BG1, BG2, BG3
          paths: [
            // Section 1: Paths 1-9
            ...Array.from({ length: 9 }, (_, i) => createPathWithCarryover(i + 1, 1)),
            // Section 2: Paths 1-9
            ...Array.from({ length: 9 }, (_, i) => createPathWithCarryover(i + 1, 2)),
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
          attackBonus: 0, // Earned bonus (updated as fights complete)
          maxAttackBonus: 63230, // Max: (9 paths × 4 nodes × 270) + (13 MBs × 270) + boss 50,000 = 9,720 + 3,510 + 50,000
          pointsPerDeath: 0, // Track points lost per death
          totalKills: 0, // Track total defender kills
          defenderKills: 0, // Track defender kills
          exploration: 0, // Exploration percentage (default 0%)
          players: data.players
            ?.filter(p => p.bgAssignment === (bgNumber - 1)) // Filter by 0-indexed bgAssignment
            .map(p => p.id) || [],
        };
      }),
    };

    const updatedWars = [...wars, newWar];
    
    // Add war to current season
    const updatedSeasonsWithWar = updatedSeasons.map(s =>
      s.id === currentSeasonId
        ? { ...s, warIds: [...(s.warIds || []), newWar.id] }
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
    const deletedWar = wars[warIndex];
    const updatedWars = wars.filter((_, index) => index !== warIndex);
    const newIndex = Math.max(0, Math.min(warIndex, updatedWars.length - 1));

    // Remove the deleted war's ID from whichever season contains it
    const seasons = data.seasons && Array.isArray(data.seasons) ? data.seasons : [];
    const updatedSeasons = seasons.map(s => ({
      ...s,
      warIds: (s.warIds || []).filter(id => id !== deletedWar.id),
    }));

    setCurrentWarIndex(newIndex);
    updateData({ wars: updatedWars, seasons: updatedSeasons, currentWarIndex: newIndex });
  };

  const handleUpdateWar = (warIndex: number, updates: Partial<War>) => {
    const wars = data.wars && Array.isArray(data.wars) && data.wars.length > 0 ? data.wars : [];
    
    if (warIndex < 0 || warIndex >= wars.length) {
      console.error('Invalid war index');
      return;
    }

    const updatedWars = [...wars];
    updatedWars[warIndex] = { ...updatedWars[warIndex], ...updates };
    updateData({ wars: updatedWars });
  };

  const handleSwitchWar = (index: number) => {
    setCurrentWarIndex(index);
    setCurrentBgIndex(0);
    updateData({ currentWarIndex: index });
  };

  const handleGenerateOfficerKey = useCallback(async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newKey = '';
    for (let i = 0; i < 6; i++) newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    // Ensure it doesn't collide with the leader key
    if (newKey === allianceKey) newKey = newKey.split('').reverse().join('');

    try {
      const db = getFirebaseDatabase();
      // Write officer pointer
      await set(ref(db, `alliances/${newKey}`), {
        isOfficerKey: true,
        linkedKey: allianceKey,
        allianceName: data.allianceName,
      });
      // Persist officerKey on the alliance data
      const updatedData = { ...data, officerKey: newKey };
      await set(ref(db, `alliances/${allianceKey}`), sanitiseForFirebase(updatedData));
      setData(updatedData);
    } catch (error) {
      console.error('Failed to generate officer key:', error);
      setErrorMessage('❌ Failed to generate officer key. Please try again.');
    }
  }, [allianceKey, data]);

  const copyShareLink = () => {
    // Share the officer key if available, so the leader key stays private
    const shareKey = data.officerKey || allianceKey;
    const link = `${window.location.origin}${window.location.pathname}?key=${shareKey}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        alert(
          `✅ Officer link copied!\n\n${link}\n\nShare this with your officers.\n\n💡 They click the link, enter the alliance name, and connect as officers automatically.`
        );
      });
    } else {
      prompt('Copy this officer link:', link);
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
          onShareLink={copyShareLink}
          onChangeAlliance={() => {
            onLogout?.();
            router.push('/');
          }}
          onShowStats={() => setShowStats(true)}
          onShowPlayerManagement={() => setShowPlayerManagement(true)}
          onShowWarComparison={() => setShowWarComparison(true)}
          onShowSeasonManagement={() => setShowSeasonManagement(true)}
          onShowSettings={() => setShowSettings(true)}
        />

        {!isOnline && (
          <div className="bg-yellow-900/50 border border-yellow-500/40 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span className="text-yellow-400 shrink-0">📡</span>
            <p className="text-yellow-200 text-xs font-bold">Offline — changes will sync when connection is restored.</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-200 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="bg-gradient-to-b from-purple-900/30 to-slate-800/80 rounded-xl p-8 mb-8 border border-purple-500/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-wider mb-2">Welcome to your Alliance!</h1>
            <p className="text-slate-400 text-sm font-medium">Get started by managing your players</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/80 rounded-xl p-6 border border-green-500/20">
              <h2 className="text-sm font-black uppercase tracking-wider text-green-400 mb-3">👥 Add Your Players</h2>
              <p className="text-slate-300 text-sm mb-4">
                Start by adding your alliance members to the system. You can assign them to battlegroups and manage their information.
              </p>
              <button
                onClick={() => setShowPlayerManagement(true)}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-black transition-colors duration-200 text-sm"
              >
                Manage Players Now
              </button>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-6 border border-blue-500/20">
              <h2 className="text-sm font-black uppercase tracking-wider text-blue-400 mb-3">⚔️ Create Your First War</h2>
              <p className="text-slate-300 text-sm mb-4">
                Once your players are added, create your first war and start tracking battles. You can always add wars later.
              </p>
              <button
                onClick={handleAddWar}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-black transition-colors duration-200 text-sm"
              >
                Create First War
              </button>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
            <p className="text-slate-300 text-center text-xs font-medium">
              <strong className="font-black">💡 Tip:</strong> You can add players now and create wars whenever you're ready. Both managers are always available in the top menu!
            </p>
          </div>
        </div>

        {showPlayerManagement && (
          <PlayerManagement
            players={data.players || []}
            archivedPlayers={data.archivedPlayers || []}
            onClose={() => setShowPlayerManagement(false)}
            onUpdatePlayers={(players) => updateData({ players })}
            onUpdateArchivedPlayers={(archivedPlayers) => updateData({ archivedPlayers })}
          />
        )}
      </div>
    );
  }

  return (
    <AppErrorBoundary>
    <div className="p-4 max-w-7xl mx-auto">
      <Header
        allianceName={data.allianceName}
        allianceTag={data.allianceTag}
        syncStatus={syncStatus}
        saveMessage={saveMessage}
        userRole={userRole}
        onShareLink={copyShareLink}
        onChangeAlliance={() => {
          onLogout?.();
          router.push('/');
        }}
        onShowStats={() => setShowStats(true)}
        onShowPlayerManagement={() => setShowPlayerManagement(true)}
        onShowWarComparison={() => setShowWarComparison(true)}
        onShowSeasonManagement={() => setShowSeasonManagement(true)}
        onShowSettings={() => setShowSettings(true)}
      />

      {!isOnline && (
        <div className="bg-yellow-900/50 border border-yellow-500/40 rounded-xl p-3 mb-4 flex items-center gap-2">
          <span className="text-yellow-400 shrink-0">📡</span>
          <p className="text-yellow-200 text-xs font-bold">Offline — changes will sync when connection is restored.</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 mb-6">
          <p className="text-red-200 text-sm">{errorMessage}</p>
        </div>
      )}

      <WarManagement
        wars={safeWars}
        currentWarIndex={safeWarIndex}
        userRole={userRole}
        onAddWar={handleAddWar}
        onSwitchWar={handleSwitchWar}
        onDeleteWar={handleDeleteWar}
        onUpdateWar={handleUpdateWar}
      />

      {showPlayerManagement && (
        <PlayerManagement
          players={data.players || []}
          archivedPlayers={data.archivedPlayers || []}
          onClose={() => setShowPlayerManagement(false)}
          onUpdatePlayers={(players) => updateData({ players })}
          onUpdateArchivedPlayers={(archivedPlayers) => updateData({ archivedPlayers })}
        />
      )}

      <div className="flex gap-3 mb-6 px-6">
        {currentWar?.isClosed ? (
          <div className="px-6 py-2 bg-amber-950/60 border border-amber-600/30 text-amber-200 rounded-xl font-black flex items-center gap-2 text-sm">
            🔒 War Closed — use the Wars panel to reopen
          </div>
        ) : (
          <button
            onClick={() => setShowPathAssignment(true)}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl transition-colors duration-200 text-sm"
            title="Assign players to paths, mini bosses, and boss"
          >
            🗺️ Assign Paths
          </button>
        )}
      </div>

      {/* ── War Overview Strip ── */}
      {currentWar?.battlegroups && (() => {
        const pathMode = data.pathAssignmentMode ?? 'split';
        // Canonical functions — single source of truth for path counting
        const pathNodeCount      = fightsPerPathRecord(pathMode);
        const inProgressNodeCount = pathNodeCount / 2; // half of full path = 1 section
        const nodeBonus = (d: number) => d === 0 ? 270 : d === 1 ? 180 : d === 2 ? 90 : 0;
        const pathBonus = (d: number) => {
          let bonus = 0, remaining = d;
          for (let i = 0; i < pathNodeCount; i++) {
            const nodesLeft = pathNodeCount - i;
            const nd = Math.ceil(remaining / nodesLeft);
            remaining -= nd;
            bonus += nodeBonus(nd);
          }
          return bonus;
        };

        return (
          <div className="px-6 mb-4">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">War Overview</div>
            <div className="grid grid-cols-3 gap-2">
              {currentWar.battlegroups.map((bg, idx) => {
                let nodesCleared = 0;
                let totalDeaths = 0;
                let totalBonus = 0;

                getCountablePaths(bg.paths || [], pathMode).forEach((path: any) => {
                  const d = (path.primaryDeaths || 0) + (path.backupDeaths || 0);
                  totalDeaths += d;
                  if (path.status === 'completed') {
                    nodesCleared += pathNodeCount;
                    if (!path.noDefender) totalBonus += pathBonus(d);
                  } else if (path.status === 'in-progress') {
                    nodesCleared += inProgressNodeCount;
                  }
                });
                (bg.miniBosses || []).forEach((mb: any) => {
                  const d = (mb.primaryDeaths || 0) + (mb.backupDeaths || 0);
                  totalDeaths += d;
                  if (mb.status === 'completed') {
                    nodesCleared += 1;
                    if (!mb.noDefender) totalBonus += nodeBonus(d);
                  }
                });
                if (bg.boss) {
                  totalDeaths += (bg.boss.primaryDeaths || 0) + (bg.boss.backupDeaths || 0);
                  if (bg.boss.status === 'completed') {
                    nodesCleared += 1;
                    if (!bg.boss.noDefender) totalBonus += 50000;
                  }
                }

                const isActive = idx === currentBgIndex;
                const bgColor = data.bgColors?.[idx + 1 as 1|2|3] ?? ['#ef4444', '#22c55e', '#3b82f6'][idx];

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentBgIndex(idx)}
                    className={`rounded-xl p-3 text-left transition-all duration-200 border-2 ${
                      isActive ? 'border-white/40 bg-slate-700/80' : 'border-transparent bg-slate-800/60 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="text-xs font-black mb-2" style={{ color: bgColor }}>BG{idx + 1}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-black uppercase">Nodes</span>
                        <span className="text-[10px] font-black text-white">{nodesCleared}/50</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-black uppercase">Deaths</span>
                        <span className={`text-[10px] font-black ${totalDeaths === 0 ? 'text-green-400' : 'text-red-400'}`}>{totalDeaths}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-black uppercase">Bonus</span>
                        <span className="text-[10px] font-black text-yellow-300">{totalBonus.toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      <BattlegroupTabs
        currentBgIndex={currentBgIndex}
        onSwitchBg={setCurrentBgIndex}
      />

      {currentBg && (
        <BattlegroupErrorBoundary bgIndex={currentBgIndex}>
          <EnhancedBattlegroupContent
            battlegroup={currentBg}
            bgIndex={currentBgIndex}
            players={[...(data.players || []), ...(data.archivedPlayers || [])]}
            pathAssignmentMode={data.pathAssignmentMode ?? 'split'}
            isReadOnly={!!(currentWar?.isClosed)}
            onUpdate={(bgUpdates) => {
              const updatedBgs = [...currentWar.battlegroups];
              updatedBgs[currentBgIndex] = { ...currentBg, ...bgUpdates };
              updateCurrentWar({ battlegroups: updatedBgs });
            }}
          />
        </BattlegroupErrorBoundary>
      )}

      {showStats && (
        <ModalErrorBoundary name="Alliance Stats">
          <StatsModal
            wars={safeWars}
            players={[...(data.players || []), ...(data.archivedPlayers || [])]}
            onClose={() => setShowStats(false)}
            bgColors={data.bgColors ?? { 1: '#ef4444', 2: '#22c55e', 3: '#3b82f6' }}
            seasons={(data.seasons || []).map(s => ({ id: s.id, name: s.name, warIds: s.warIds || [] }))}
            pathAssignmentMode={data.pathAssignmentMode ?? 'split'}
          />
        </ModalErrorBoundary>
      )}

      {showWarComparison && (
        <ModalErrorBoundary name="War Comparison">
          <WarComparisonDashboard
            wars={safeWars}
            pathAssignmentMode={data.pathAssignmentMode ?? 'split'}
            onClose={() => setShowWarComparison(false)}
          />
        </ModalErrorBoundary>
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
          onSwitchWar={(index) => {
            handleSwitchWar(index);
            setShowSeasonManagement(false);
          }}
        />
      )}

      {showPathAssignment && currentWar && (
        <PathAssignmentModal
          isOpen={showPathAssignment}
          onClose={() => setShowPathAssignment(false)}
          war={currentWar}
          bgIndex={currentBgIndex}
          players={data.players || []}
          pathAssignmentMode={data.pathAssignmentMode ?? 'split'}
          onUpdateWar={(updatedWar) => {
            const updatedWars = (data.wars || []).map((w, idx) =>
              idx === currentWarIndex ? updatedWar : w
            );
            updateData({ wars: updatedWars });
          }}
        />
      )}

      {showSettings && (
        <AllianceSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          allianceName={data.allianceName}
          allianceTag={data.allianceTag}
          bgColors={data.bgColors ?? { 1: '#ef4444', 2: '#22c55e', 3: '#3b82f6' }}
          pathAssignmentMode={data.pathAssignmentMode ?? 'split'}
          userRole={userRole}
          leaderKey={userRole === 'leader' ? allianceKey : undefined}
          officerKey={userRole === 'leader' ? data.officerKey : undefined}
          onGenerateOfficerKey={userRole === 'leader' ? handleGenerateOfficerKey : undefined}
          onSave={(updates) => {
            updateData({
              allianceName: updates.allianceName,
              allianceTag: updates.allianceTag,
              bgColors: updates.bgColors,
              pathAssignmentMode: updates.pathAssignmentMode,
            });
            setShowSettings(false);
          }}
        />
      )}
    </div>
    </AppErrorBoundary>
  );
}