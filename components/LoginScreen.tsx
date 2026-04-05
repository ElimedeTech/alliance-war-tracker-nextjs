'use client';

import { useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebase';
import { AllianceData } from '@/types';

interface LoginScreenProps {
  onLogin: (key: string, data: AllianceData, userRole: 'leader' | 'officer') => void;
}

/** Generate a random 6-char alphanumeric key */
function generateRandomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 6; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [allianceName, setAllianceName] = useState('');
  const [allianceKey, setAllianceKey] = useState('');
  const [keyHint, setKeyHint] = useState('Enter your existing alliance key');
  const [keyHintColor, setKeyHintColor] = useState('text-slate-400');
  const [mode, setMode] = useState<'join' | 'create' | null>(null);

  // Pending create state — shows both keys after generation, before Connect
  const [pendingLeaderKey, setPendingLeaderKey] = useState('');
  const [pendingOfficerKey, setPendingOfficerKey] = useState('');
  const [copied, setCopied] = useState<'leader' | 'officer' | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('key');
    if (keyParam?.trim()) {
      setAllianceKey(keyParam.trim());
      setMode('join');
      setKeyHint('✅ Key loaded from URL — enter your alliance name and click Connect');
      setKeyHintColor('text-blue-400');
    }
  }, []);

  const handleModeSelect = (selectedMode: 'join' | 'create') => {
    setMode(selectedMode);
    setPendingLeaderKey('');
    setPendingOfficerKey('');
    setAllianceKey('');
    setAllianceName('');
    setKeyHint(
      selectedMode === 'create'
        ? 'Generate keys for your new alliance'
        : 'Enter the key you received from your leader'
    );
    setKeyHintColor('text-slate-400');
  };

  const handleGenerateKeys = () => {
    if (!allianceName.trim()) {
      alert('⚠️ Please enter your alliance name first!');
      return;
    }
    const lk = generateRandomKey();
    let ok = generateRandomKey();
    // Ensure they differ (astronomically unlikely to collide, but be safe)
    while (ok === lk) ok = generateRandomKey();
    setPendingLeaderKey(lk);
    setPendingOfficerKey(ok);
    setAllianceKey(lk);
    setKeyHint('🔑 Keys generated! Click "Create Alliance" to save them.');
    setKeyHintColor('text-green-400');
  };

  const copyKey = (key: string, which: 'leader' | 'officer') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key).then(() => {
        setCopied(which);
        setTimeout(() => setCopied(null), 2000);
      });
    } else {
      prompt(`Copy this key:`, key);
    }
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
      const keyRef = ref(db, `alliances/${allianceKey}`);
      const snapshot = await get(keyRef);

      let data: AllianceData;
      let resolvedLeaderKey = allianceKey;
      let userRole: 'leader' | 'officer' = 'leader';

      if (snapshot.exists()) {
        const raw = snapshot.val();

        // ── Officer pointer check ────────────────────────────────────────
        if (raw.isOfficerKey === true && raw.linkedKey) {
          // Resolve to the real alliance data
          resolvedLeaderKey = raw.linkedKey;
          userRole = 'officer';

          const linkedRef = ref(db, `alliances/${resolvedLeaderKey}`);
          const linkedSnap = await get(linkedRef);

          if (!linkedSnap.exists()) {
            alert('❌ Linked alliance data not found. Contact your leader.');
            return;
          }

          const linked = linkedSnap.val();

          // Validate alliance name against the linked data
          if ((linked.allianceName || '').trim().toLowerCase() !== allianceName.trim().toLowerCase()) {
            alert(
              `❌ Alliance name mismatch!\n\nExpected: ${linked.allianceName}\nYou entered: ${allianceName.trim()}\n\nPlease enter the correct alliance name.`
            );
            return;
          }

          data = buildAllianceData(linked, allianceName);
          alert(
            `✅ Connected to ${data.allianceName}!\n\n📊 ${data.wars.length} wars · 👥 ${data.players.length} players\n\n🛡️ You are an Officer`
          );
        } else {
          // ── Existing leader data ─────────────────────────────────────────
          if ((raw.allianceName || '').trim().toLowerCase() !== allianceName.trim().toLowerCase()) {
            alert(
              `❌ Alliance name mismatch!\n\nExpected: ${raw.allianceName}\nYou entered: ${allianceName.trim()}\n\nPlease enter the correct alliance name.`
            );
            return;
          }
          userRole = 'leader';
          data = buildAllianceData(raw, allianceName);
          alert(
            `✅ Connected to ${data.allianceName}!\n\n📊 ${data.wars.length} wars · 👥 ${data.players.length} players\n\n👑 You are the Alliance Leader`
          );
        }
      } else {
        // ── Create new alliance (mode === 'create' with generated keys) ──
        if (mode !== 'create' || !pendingLeaderKey) {
          alert(
            '❌ This alliance does not exist!\n\nIf you are a leader, use "Create New Alliance" and generate your keys first.\nIf you are an officer, ask your leader for the correct key.'
          );
          return;
        }

        const officerKey = pendingOfficerKey;

        data = {
          allianceName: allianceName.trim(),
          allianceTag: '',
          wars: [],
          players: [],
          currentWarIndex: 0,
          seasons: [],
          playerPerformances: [],
          officerKey,
        };

        // Save alliance data under leader key
        await set(ref(db, `alliances/${resolvedLeaderKey}`), data);

        // Save officer pointer under officer key
        await set(ref(db, `alliances/${officerKey}`), {
          isOfficerKey: true,
          linkedKey: resolvedLeaderKey,
          allianceName: allianceName.trim(),
        });

        userRole = 'leader';
        alert(
          `✅ Alliance "${allianceName}" created!\n\n👑 Leader Key: ${resolvedLeaderKey}\n🛡️ Officer Key: ${officerKey}\n\nKeep your Leader Key private.\nShare the Officer Key with your officers.\n\n💡 Use the Settings menu to view both keys again.`
        );
      }

      // Update URL with the resolved leader key
      window.history.replaceState({}, '', `${window.location.pathname}?key=${resolvedLeaderKey}`);
      onLogin(resolvedLeaderKey, data, userRole);
    } catch (error) {
      console.error('Error connecting to alliance:', error);
      alert('❌ Failed to connect. Please check your internet connection and try again.');
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

        <h1 className="text-2xl font-black uppercase tracking-wider text-center mb-2">
          Alliance War Tracker
        </h1>
        <p className="text-center text-slate-400 text-xs font-medium mb-6">🔒 Secure Cloud-Based Collaboration</p>

        {!mode ? (
          <>
            <div className="space-y-3 mb-6">
              <p className="text-center text-slate-300 font-semibold mb-4 text-sm">What would you like to do?</p>
              <button
                onClick={() => handleModeSelect('join')}
                className="w-full p-4 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/50 hover:border-blue-400 rounded-xl transition text-left"
              >
                <p className="text-blue-300 font-black text-sm mb-1">🛡️ Join Existing Alliance</p>
                <p className="text-xs text-blue-200/70">I have a key from my leader</p>
              </button>
              <button
                onClick={() => handleModeSelect('create')}
                className="w-full p-4 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/50 hover:border-purple-400 rounded-xl transition text-left"
              >
                <p className="text-purple-300 font-black text-sm mb-1">👑 Create New Alliance</p>
                <p className="text-xs text-purple-200/70">I'm starting a new alliance</p>
              </button>
            </div>

            <div className="mt-2 p-3 bg-green-900/30 rounded-xl border border-green-500/20">
              <p className="text-xs text-green-300 mb-1 font-black">🔗 Got a Share Link?</p>
              <p className="text-xs text-green-200/70">Just click it — the key loads automatically. Then enter your alliance name and connect.</p>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setMode(null)}
              className="text-xs text-slate-400 hover:text-slate-300 mb-4 flex items-center gap-1 font-medium"
            >
              ← Change mode
            </button>

            {/* Alliance Name */}
            <div className="mb-4">
              <label className="block text-slate-300 mb-2 text-xs font-black uppercase tracking-wider">
                Alliance Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={allianceName}
                onChange={(e) => setAllianceName(e.target.value)}
                placeholder="Enter your alliance name"
                className="input-field"
                onKeyDown={(e) => e.key === 'Enter' && connectToAlliance()}
              />
            </div>

            {mode === 'create' ? (
              <>
                {/* Generate Keys button */}
                {!pendingLeaderKey && (
                  <button
                    onClick={handleGenerateKeys}
                    className="w-full mb-4 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-black rounded-xl transition text-sm"
                  >
                    🔑 Generate Alliance Keys
                  </button>
                )}

                {/* Keys display */}
                {pendingLeaderKey && (
                  <div className="mb-4 space-y-3">
                    {/* Leader Key */}
                    <div className="p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
                          👑 Leader Key (keep private)
                        </span>
                        <button
                          onClick={() => copyKey(pendingLeaderKey, 'leader')}
                          className="text-[10px] font-black text-yellow-400 hover:text-yellow-200 transition px-2 py-0.5 bg-yellow-900/50 rounded-lg"
                        >
                          {copied === 'leader' ? '✅ Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="font-mono font-black text-xl text-white tracking-widest">{pendingLeaderKey}</p>
                    </div>

                    {/* Officer Key */}
                    <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                          🛡️ Officer Key (share with officers)
                        </span>
                        <button
                          onClick={() => copyKey(pendingOfficerKey, 'officer')}
                          className="text-[10px] font-black text-blue-400 hover:text-blue-200 transition px-2 py-0.5 bg-blue-900/50 rounded-lg"
                        >
                          {copied === 'officer' ? '✅ Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="font-mono font-black text-xl text-white tracking-widest">{pendingOfficerKey}</p>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium text-center">
                      Both keys are also visible in Settings after you connect.
                    </p>
                  </div>
                )}

                <button
                  onClick={connectToAlliance}
                  disabled={!pendingLeaderKey}
                  className="w-full py-3 px-6 rounded-xl font-black flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                  </svg>
                  Create Alliance
                </button>
              </>
            ) : (
              <>
                {/* Join mode — enter key */}
                <div className="mb-6">
                  <label className="block text-slate-300 mb-2 text-xs font-black uppercase tracking-wider">
                    Alliance Key <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={allianceKey}
                      onChange={(e) => setAllianceKey(e.target.value.toUpperCase())}
                      placeholder="Paste the key from your leader"
                      className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl border border-slate-600 focus:border-purple-500 focus:outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && connectToAlliance()}
                    />
                    {allianceKey && (
                      <button
                        onClick={() => setAllianceKey('')}
                        className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition text-sm"
                        title="Clear key"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className={`text-xs ${keyHintColor} mt-2 font-semibold`}>{keyHint}</p>
                </div>

                <button
                  onClick={connectToAlliance}
                  className="w-full py-3 px-6 rounded-xl font-black flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 transition text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                  </svg>
                  Connect to Alliance
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAllianceData(raw: any, fallbackName: string): AllianceData {
  const data: AllianceData = {
    allianceName: raw.allianceName || fallbackName.trim(),
    allianceTag: raw.allianceTag || '',
    wars: [],
    players: raw.players || [],
    archivedPlayers: raw.archivedPlayers,
    currentWarIndex: raw.currentWarIndex || 0,
    seasons: raw.seasons || [],
    playerPerformances: raw.playerPerformances || [],
    currentSeasonId: raw.currentSeasonId,
    bgColors: raw.bgColors,
    pathAssignmentMode: raw.pathAssignmentMode,
    officerKey: raw.officerKey,
  };

  if (raw.wars) {
    data.wars = Array.isArray(raw.wars)
      ? raw.wars
      : Object.values(raw.wars).filter((w) => w && typeof w === 'object') as any;
  }

  return data;
}
