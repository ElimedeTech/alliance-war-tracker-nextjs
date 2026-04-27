import { useState, useEffect } from 'react';
import { War } from '@/types';

interface WarManagementProps {
  wars: War[];
  currentWarIndex: number;
  userRole: 'leader' | 'officer';
  onAddWar: () => void;
  onSwitchWar: (index: number) => void;
  onDeleteWar: (index: number) => void;
  onUpdateWar?: (index: number, updates: Partial<War>) => void;
}

export default function WarManagement({
  wars,
  currentWarIndex,
  userRole,
  onAddWar,
  onSwitchWar,
  onDeleteWar,
  onUpdateWar,
}: WarManagementProps) {
  // Local state for opponent name input — saves to Firebase on blur only
  const [opponentDraft, setOpponentDraft] = useState(wars[currentWarIndex]?.opponentName ?? '');

  // Sync draft only when the active war's stored opponent name actually changes,
  // not on every Firebase update to the whole wars array (which would wipe
  // the input while the user is mid-typing).
  useEffect(() => {
    setOpponentDraft(wars[currentWarIndex]?.opponentName ?? '');
  }, [currentWarIndex, wars[currentWarIndex]?.opponentName]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteWar = (index: number) => {
    const warToDelete = wars[index];
    const warName = warToDelete.name;
    const warDate = warToDelete.startDate || 'No date';

    if (confirm(`Are you sure you want to delete "${warName}" (${warDate})?\n\nThis action cannot be undone.`)) {
      onDeleteWar(index);
    }
  };

  // Parse date parts directly from the YYYY-MM-DD string to avoid the
  // UTC-vs-local timezone pitfall: new Date("YYYY-MM-DD") is midnight UTC,
  // so local-time getDate() returns the previous day for UTC-negative timezones.
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day) return dateString;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    } catch {
      return dateString;
    }
  };

  const currentWar = wars[currentWarIndex];

  const handleResultChange = (result: 'win' | 'loss' | 'pending') => {
    if (onUpdateWar) {
      onUpdateWar(currentWarIndex, { allianceResult: result });
    }
  };

  const handleCloseWar = () => {
    if (currentWar.allianceResult !== 'win' && currentWar.allianceResult !== 'loss') {
      alert('Please set the war result to Win or Loss before closing.\n\nA war cannot be closed as Pending or Tie.');
      return;
    }

    if (confirm(`Close war "${currentWar.name}"? Recording will be locked.\n\nLeaders and officers can reopen it at any time from the Wars panel.`)) {
      if (onUpdateWar) {
        onUpdateWar(currentWarIndex, {
          isClosed: true,
          endDate: new Date().toISOString().split('T')[0]
        });
      }
    }
  };

  const handleReopenWar = () => {
    if (confirm(`Reopen "${currentWar?.name}"?\n\nRecording and path assignment will be unlocked for editing.`)) {
      onUpdateWar?.(currentWarIndex, { isClosed: false });
    }
  };

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 mb-4 border border-slate-700/50">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">Wars</h2>
        <button
          onClick={onAddWar}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-black transition-colors duration-200 flex items-center gap-2 text-xs"
        >
          <span>➕</span>
          <span>Add War</span>
        </button>
      </div>

      {wars.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {wars.every(w => w.isClosed) ? (
              <p className="text-xs text-slate-400 italic">All wars closed — use Seasons to view or reopen them.</p>
            ) : (
              wars.map((war, index) => {
                if (war.isClosed) return null;
                const isActive = index === currentWarIndex;
                const formattedDate = formatDate(war.startDate);

                return (
                  <div
                    key={war.id}
                    className={`flex items-center gap-2 rounded-xl ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    } transition-colors duration-200`}
                  >
                    <button
                      onClick={() => onSwitchWar(index)}
                      className="px-4 py-2 font-bold flex-1 text-left text-sm"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{war.name}</span>
                          {war.opponentName && (
                            <span className={`text-xs font-semibold ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                              vs {war.opponentName}
                            </span>
                          )}
                          {war.allianceResult === 'win' && <span className="text-xs bg-green-600 px-2 py-0.5 rounded-lg">✅ Win</span>}
                          {war.allianceResult === 'loss' && <span className="text-xs bg-red-600 px-2 py-0.5 rounded-lg">❌ Loss</span>}
                        </div>
                        {formattedDate && (
                          <span className={`text-xs ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                            📅 {formattedDate}
                          </span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteWar(index)}
                      className={`px-3 py-2 hover:bg-red-600 hover:text-white rounded-r-xl transition-colors duration-200 ${
                        isActive ? 'text-purple-200' : 'text-slate-400'
                      }`}
                      title="Delete this war"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Closed War Panel ── shown when the active war is closed (navigated via Seasons) */}
          {currentWar && currentWar.isClosed && (
            <div className="bg-slate-700/50 rounded-xl p-4 border border-amber-600/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-400 text-base">🔒</span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">Closed War</h3>
                  </div>
                  <p className="text-slate-200 text-sm font-bold">{currentWar.name}</p>
                  {currentWar.opponentName && (
                    <p className="text-slate-400 text-xs mt-0.5">vs {currentWar.opponentName}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {currentWar.allianceResult === 'win' && (
                      <span className="text-xs bg-green-600/80 text-white px-2 py-0.5 rounded-lg font-black">✅ Win</span>
                    )}
                    {currentWar.allianceResult === 'loss' && (
                      <span className="text-xs bg-red-600/80 text-white px-2 py-0.5 rounded-lg font-black">❌ Loss</span>
                    )}
                    {currentWar.endDate && (
                      <span className="text-xs text-slate-500">Closed {formatDate(currentWar.endDate)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleReopenWar}
                  className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs transition-colors duration-200 flex items-center gap-1.5"
                >
                  🔓 Reopen
                </button>
              </div>
            </div>
          )}

          {/* ── Open War Management Panel ── */}
          {currentWar && !currentWar.isClosed && (
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/30">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">Manage: {currentWar.name}</h3>

              {/* Opponent Name */}
              <div className="mb-4">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Opponent Alliance</label>
                <input
                  type="text"
                  value={opponentDraft}
                  onChange={(e) => setOpponentDraft(e.target.value)}
                  onBlur={() => onUpdateWar?.(currentWarIndex, { opponentName: opponentDraft.trim() })}
                  placeholder="e.g. Dark Templars or [DKT]"
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* War Result */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">War Result</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResultChange('win')}
                      className={`flex-1 px-3 py-2 rounded-lg font-black text-xs transition-colors duration-200 ${
                        currentWar.allianceResult === 'win'
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      ✅ Win
                    </button>
                    <button
                      onClick={() => handleResultChange('loss')}
                      className={`flex-1 px-3 py-2 rounded-lg font-black text-xs transition-colors duration-200 ${
                        currentWar.allianceResult === 'loss'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      ❌ Loss
                    </button>
                    <button
                      onClick={() => handleResultChange('pending')}
                      className={`flex-1 px-3 py-2 rounded-lg font-black text-xs transition-colors duration-200 ${
                        currentWar.allianceResult === 'pending'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      ⏳ Pending
                    </button>
                  </div>
                </div>

                {/* Close War Button */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">War Status</label>
                  <button
                    onClick={handleCloseWar}
                    className="w-full px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition-colors duration-200"
                  >
                    🔒 Close War
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}