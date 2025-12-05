'use client';

import { useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebase';
import { AllianceData } from '@/types';

interface LoginScreenProps {
  onLogin: (key: string, data: AllianceData) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [allianceName, setAllianceName] = useState('');
  const [allianceTag, setAllianceTag] = useState('');
  const [allianceKey, setAllianceKey] = useState('');
  const [keyHint, setKeyHint] = useState('Create new key or enter existing key');
  const [keyHintColor, setKeyHintColor] = useState('text-gray-400');

  useEffect(() => {
    // Check for URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('key');
    
    if (keyParam && keyParam.trim()) {
      setAllianceKey(keyParam.trim());
      setKeyHint('✅ Alliance key loaded from URL! Enter your alliance name above and click Connect');
      setKeyHintColor('text-blue-400');
    }
  }, []);

  const generateKey = () => {
    if (!allianceName.trim()) {
      alert('⚠️ Please enter your alliance name first!');
      return;
    }
    
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const newKey = `${timestamp}-${random}`;
    
    setAllianceKey(newKey);
    setKeyHint('🔑 New key generated! Click "Connect" to create your alliance data');
    setKeyHintColor('text-green-400');
  };

  const createEmptyWar = (warNumber: number) => {
    const createEmptyPath = (pathNumber: number) => ({
      id: `path-${pathNumber}-${Date.now()}-${Math.random()}`,
      pathNumber,
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
        // 9 paths
        paths: [
          createEmptyPath(1),
          createEmptyPath(2),
          createEmptyPath(3),
          createEmptyPath(4),
          createEmptyPath(5),
          createEmptyPath(6),
          createEmptyPath(7),
          createEmptyPath(8),
          createEmptyPath(9),
        ],
        // 13 Mini Bosses (nodes 37-49)
        miniBosses: Array(13).fill(null).map((_, i) => createMiniBoss(37 + i)),
        // Final Boss (node 50)
        boss: {
          id: `boss-50-${Date.now()}-${Math.random()}`,
          nodeNumber: 50,
          status: 'not-started' as const,
          deaths: 0,
          assignedPlayer: '',
          notes: '',
        },
        attackBonus: 0,
        maxAttackBonus: 13500,
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
        console.log('✅ Connected to existing alliance data');
        console.log('Data structure:', existingData);
        
        // Handle data migration from old version - multiple possible structures
        data = {
          allianceName: existingData.allianceName || allianceName.trim(),
          allianceTag: existingData.allianceTag || allianceTag.trim() || '',
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
            boss: { status: 'not-started' as const, deaths: 0 },
            attackBonus: 240,
            players: [],
          })),
        }));
        
        // If no wars exist after migration, create first war
        if (!data.wars || data.wars.length === 0) {
          console.log('No wars found, creating first war');
          data.wars = [createEmptyWar(1)];
        }
        
        console.log(`Migrated ${data.wars.length} wars successfully`);
        alert(`✅ Connected to ${data.allianceName}!\n\n📊 Found ${data.wars.length} wars\n👥 Found ${data.players.length} players\n\nYour data has been migrated to the new format!`);
      } else {
        // Create new alliance data
        data = {
          allianceName: allianceName.trim(),
          allianceTag: allianceTag.trim(),
          wars: [createEmptyWar(1)],
          players: [],
          currentWarIndex: 0,
          seasons: [],
          playerPerformances: [],
        };

        await set(dataRef, data);
        console.log('✅ New alliance created');
        alert(`✅ New alliance "${allianceName}" created!\n\n🔑 Your Alliance Key: ${allianceKey}\n\n📋 Share this key or use the "Share Link" button inside to invite officers!`);
      }

      // Update URL with key
      const newUrl = `${window.location.pathname}?key=${allianceKey}`;
      window.history.replaceState({}, '', newUrl);

      onLogin(allianceKey, data);
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
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2 font-semibold">Alliance Name</label>
          <input
            type="text"
            value={allianceName}
            onChange={(e) => setAllianceName(e.target.value)}
            placeholder="Enter your alliance name"
            className="input-field"
            onKeyPress={(e) => e.key === 'Enter' && connectToAlliance()}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 mb-2 font-semibold">
            Alliance Tag <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={allianceTag}
            onChange={(e) => setAllianceTag(e.target.value)}
            placeholder="e.g., [ABC]"
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
              placeholder="Enter or generate"
              className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-purple-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && connectToAlliance()}
            />
            <button onClick={generateKey} className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition">
              Generate
            </button>
          </div>
          <p className={`text-sm ${keyHintColor} mt-2 font-semibold`}>{keyHint}</p>
        </div>
        
        <button onClick={connectToAlliance} className="w-full py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
          </svg>
          Connect to Alliance Data
        </button>

        <div className="mt-4 space-y-3">
          <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
            <p className="text-xs text-blue-300 mb-1"><strong>🆕 New Alliance?</strong></p>
            <p className="text-xs text-blue-200">Enter your alliance name and click &quot;Generate&quot; to create your key!</p>
          </div>
          <div className="p-4 bg-green-900/30 rounded-lg border border-green-500/30">
            <p className="text-xs text-green-300 mb-1"><strong>👥 Got a Share Link?</strong></p>
            <p className="text-xs text-green-200">Just click the link your leader sent - the key is in the URL!</p>
          </div>
          <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
            <p className="text-xs text-purple-300 mb-1"><strong>🔑 Have the Alliance Key?</strong></p>
            <p className="text-xs text-purple-200">Enter your alliance name, paste the key, and click Connect!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
