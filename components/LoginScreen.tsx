'use client';

import { useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebase';
import { AllianceData } from '@/types';

interface LoginScreenProps {
  onLogin: (key: string, data: AllianceData, userRole: 'leader' | 'officer') => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [allianceName, setAllianceName] = useState('');
  const [allianceKey, setAllianceKey] = useState('');
  const [userRole, setUserRole] = useState<'leader' | 'officer'>('officer');
  const [keyHint, setKeyHint] = useState('Enter your existing alliance key');
  const [keyHintColor, setKeyHintColor] = useState('text-gray-400');
  const [mode, setMode] = useState<'join' | 'create' | null>(null);

  useEffect(() => {
    // Check for URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('key');
    
    if (keyParam && keyParam.trim()) {
      setAllianceKey(keyParam.trim());
      setMode('join');
      setKeyHint('✅ Alliance key loaded from URL! Enter your alliance name and click Connect');
      setKeyHintColor('text-blue-400');
      setUserRole('officer'); // Auto-set to officer when using shared link
    }
  }, []);

  const generateKey = () => {
    if (!allianceName.trim()) {
      alert('⚠️ Please enter your alliance name first!');
      return;
    }
    
    // Generate 6 alphanumeric characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newKey = '';
    for (let i = 0; i < 6; i++) {
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setAllianceKey(newKey);
    setUserRole('leader'); // Set as leader when generating new key
    setKeyHint('🔑 New key generated! You are the Alliance Leader. Click "Connect" to create your alliance.');
    setKeyHintColor('text-green-400');
  };

  const handleModeSelect = (selectedMode: 'join' | 'create') => {
    setMode(selectedMode);
    if (selectedMode === 'create') {
      setUserRole('leader');
      setKeyHint('Generate a unique key for your new alliance');
      setKeyHintColor('text-gray-400');
    } else {
      setUserRole('officer');
      setKeyHint('Enter the alliance key you received from your leader');
      setKeyHintColor('text-gray-400');
    }
    setAllianceKey('');
    setAllianceName('');
  };

  const createEmptyWar = (warNumber: number) => {
    const createEmptyPath = (pathNumber: number, section: 1 | 2) => ({
      id: `path-${pathNumber}-${section}-${Date.now()}-${Math.random()}`,
      pathNumber,
      section,
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

    const createMiniBoss = (nodeNumber: number) => ({
      id: `miniboss-${nodeNumber}-${Date.now()}-${Math.random()}`,
      nodeNumber,
      name: `Mini Boss ${nodeNumber - 36}`,
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
      id: `war-${warNumber}-${Date.now()}`,
      name: `War ${warNumber}`,
      battlegroups: [0, 1, 2].map((bgIndex) => ({
        bgNumber: bgIndex + 1,
        // Section 1: Paths 1-9
        paths: [
          ...Array.from({ length: 9 }, (_, i) => createEmptyPath(i + 1, 1)),
          // Section 2: Paths 1-9
          ...Array.from({ length: 9 }, (_, i) => createEmptyPath(i + 1, 2)),
        ],
        // 13 Mini Bosses (nodes 37-49)
        miniBosses: Array(13).fill(null).map((_, i) => createMiniBoss(37 + i)),
        // Final Boss (node 50)
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
        attackBonus: 0,
        maxAttackBonus: 63230, // Max: (18 paths × 2 nodes × 270) + (13 MBs × 270) + boss × 50000
        pointsPerDeath: 0,
        totalKills: 0,
        defenderKills: 0,
        exploration: 0,
        players: [], // Will be populated from player assignments
      })),
    };
  };

  const connectToAlliance = async () => {
    if (!allianceName.trim()) {
      alert('⚠️ Please enter your alliance name!');
      return;
    }
    
    if (!allianceKey.trim()) {
      alert('⚠️ Please enter or generate an alliance key!');
      return;
    }

    try {
      const db = getFirebaseDatabase();
      const dataRef = ref(db, `alliances/${allianceKey}`);
      const snapshot = await get(dataRef);

      let data: AllianceData;

      if (snapshot.exists()) {
        // Load existing data
        const existingData = snapshot.val();
        
        // ✅ Validate alliance name matches the key
        const storedAllianceName = (existingData.allianceName || '').trim().toLowerCase();
        const enteredAllianceName = allianceName.trim().toLowerCase();
        
        if (storedAllianceName !== enteredAllianceName) {
          alert(`❌ Alliance Name Mismatch!\n\nThe alliance name you entered does not match the stored alliance name.\n\n📝 Expected: ${existingData.allianceName}\n📝 You entered: ${allianceName.trim()}\n\nPlease enter the correct alliance name to login.`);
          return;
        }
        
        console.log('✅ Connected to existing alliance data');
        console.log('Data structure:', existingData);
        
        // Handle data migration from old version - multiple possible structures
        data = {
          allianceName: existingData.allianceName || allianceName.trim(),
          allianceTag: existingData.allianceTag || '',
          wars: [],
          players: existingData.players || [],
          currentWarIndex: existingData.currentWarIndex || 0,
          seasons: existingData.seasons || [],
          playerPerformances: existingData.playerPerformances || [],
          currentSeasonId: existingData.currentSeasonId,
        };
        
        // Handle wars - could be array or object
        if (existingData.wars) {
          if (Array.isArray(existingData.wars)) {
            // Already an array - use as is
            data.wars = existingData.wars as any;
          } else if (typeof existingData.wars === 'object') {
            // Convert object to array
            data.wars = Object.values(existingData.wars).filter(w => w && typeof w === 'object') as any;
          }
        }
        
        // Ensure each war has proper structure
        data.wars = data.wars.map((war, index) => ({
          id: war.id || `war-${index + 1}-${Date.now()}`,
          name: war.name || `War ${index + 1}`,
          battlegroups: war.battlegroups || [0, 1, 2].map(() => ({
            paths: [],
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
            attackBonus: 240,
            players: [],
          })),
        }));
        
        // Don't auto-create wars - let user add them manually
        if (!data.wars || data.wars.length === 0) {
          console.log('No wars found - user can add wars using "Add War" button');
          data.wars = [];
        }
        
        console.log(`Migrated ${data.wars.length} wars successfully`);
        alert(`✅ Connected to ${data.allianceName}!\n\n📊 Found ${data.wars.length} wars\n👥 Found ${data.players.length} players\n\n${userRole === 'leader' ? '👑 You are the Alliance Leader' : '🛡️ You are an Officer'}\n\n${data.wars.length === 0 ? '💡 Click "Add War" to create your first war' : ''}`);
      } else {
        // Create new alliance data - only leaders can do this
        if (userRole !== 'leader') {
          alert('❌ This alliance does not exist!\n\nOnly the Alliance Leader can create new alliances.\nIf you\'re an officer, ask your leader for the correct key.');
          return;
        }

        data = {
          allianceName: allianceName.trim(),
          allianceTag: '',
          wars: [], // Start with no wars - user clicks "Add War" to create first one
          players: [],
          currentWarIndex: 0,
          seasons: [],
          playerPerformances: [],
        };

        await set(dataRef, data);
        console.log('✅ New alliance created');
        alert(`✅ New alliance "${allianceName}" created!\n\n🔑 Your Alliance Key: ${allianceKey}\n\n👑 You are the Alliance Leader\n\n📋 Share the key or use "Share Link" to invite officers!\n\n💡 Click "Add War" to create your first war`);
      }

      // Update URL with key
      const newUrl = `${window.location.pathname}?key=${allianceKey}`;
      window.history.replaceState({}, '', newUrl);

      onLogin(allianceKey, data, userRole);
    } catch (error) {
      console.error('Error connecting to alliance:', error);
      alert('❌ Failed to connect to alliance. Please check your internet connection and try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="7.5" cy="15.5" r="5.5"/>
            <path d="m21 2-9.6 9.6"/>
            <path d="m15.5 7.5 3 3L22 7l-3-3"/>
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">Alliance War Tracker</h1>
        <p className="text-center text-gray-400 text-sm mb-6">🔒 Secure Cloud-Based Collaboration</p>
        
        {!mode ? (
          <div className="space-y-3 mb-6">
            <p className="text-center text-gray-300 font-semibold mb-4">What would you like to do?</p>
            <button
              onClick={() => handleModeSelect('join')}
              className="w-full p-4 bg-blue-900/30 hover:bg-blue-900/50 border-2 border-blue-500/50 hover:border-blue-400 rounded-lg transition text-left"
            >
              <p className="text-blue-300 font-bold mb-1">🛡️ Join Existing Alliance</p>
              <p className="text-xs text-blue-200">I have an alliance key from my leader</p>
            </button>
            <button
              onClick={() => handleModeSelect('create')}
              className="w-full p-4 bg-purple-900/30 hover:bg-purple-900/50 border-2 border-purple-500/50 hover:border-purple-400 rounded-lg transition text-left"
            >
              <p className="text-purple-300 font-bold mb-1">👑 Create New Alliance</p>
              <p className="text-xs text-purple-200">I'm starting a new alliance</p>
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <button
                onClick={() => setMode(null)}
                className="text-sm text-gray-400 hover:text-gray-300 mb-4 flex items-center gap-1"
              >
                ← Change mode
              </button>
              
              <label className="block text-gray-300 mb-2 font-semibold">
                Alliance Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={allianceName}
                onChange={(e) => setAllianceName(e.target.value)}
                placeholder="Enter your alliance name"
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && connectToAlliance()}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">
                Alliance Key <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={allianceKey}
                  onChange={(e) => setAllianceKey(e.target.value)}
                  placeholder={mode === 'create' ? 'Click "Generate" to create a new key' : 'Paste the key you received from your leader'}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-purple-500 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && connectToAlliance()}
                />
                {mode === 'create' && !allianceKey && (
                  <button onClick={generateKey} className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition whitespace-nowrap">
                    Generate
                  </button>
                )}
                {allianceKey && (
                  <button onClick={() => setAllianceKey('')} className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition whitespace-nowrap" title="Clear key">
                    Clear
                  </button>
                )}
              </div>
              <p className={`text-sm ${keyHintColor} mt-2 font-semibold`}>{keyHint}</p>
            </div>
            
            <button onClick={connectToAlliance} className="w-full py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
              </svg>
              Connect to Alliance
            </button>

            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
              <p className="text-xs text-gray-300">
                {mode === 'create' 
                  ? '📝 Enter your alliance name, then click "Generate" to create a unique key for your new alliance.'
                  : '📝 Enter your alliance name and paste the key your leader shared with you.'}
              </p>
            </div>
          </>
        )}

        {!mode && (
          <div className="mt-6 space-y-2">
            <div className="p-3 bg-green-900/30 rounded-lg border border-green-500/30">
              <p className="text-xs text-green-300 mb-1"><strong>🔗 Got a Share Link?</strong></p>
              <p className="text-xs text-green-200">Just click it - the key loads automatically. Then enter your alliance name and connect.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}