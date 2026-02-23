'use client';

import { useState } from 'react';
import { Season, War } from '@/types';

interface SeasonManagementProps {
  seasons: Season[];
  allWars: War[];
  currentSeasonId?: string;
  onUpdateSeasons: (seasons: Season[], currentSeasonId?: string) => void;
  onClose: () => void;
}

export default function SeasonManagement({
  seasons,
  allWars,
  currentSeasonId,
  onUpdateSeasons,
  onClose,
}: SeasonManagementProps) {
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonNumber, setNewSeasonNumber] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(currentSeasonId || null);

  const createSeason = () => {
    if (!newSeasonName.trim()) {
      alert('Please enter a season name');
      return;
    }

    const newSeason: Season = {
      id: `season-${Date.now()}`,
      name: newSeasonName.trim(),
      seasonNumber: newSeasonNumber ? parseInt(newSeasonNumber) : undefined,
      startDate: new Date().toISOString(),
      warIds: [],
      isActive: true,
    };

    // Deactivate all other seasons
    const updatedSeasons = seasons.map(s => ({ ...s, isActive: false }));
    updatedSeasons.push(newSeason);

    onUpdateSeasons(updatedSeasons, newSeason.id);
    setNewSeasonName('');
    setNewSeasonNumber('');
    setShowCreateForm(false);
    setSelectedSeasonId(newSeason.id);
  };

  const endSeason = (seasonId: string) => {
    if (!confirm('End this season? This will mark it as complete.')) {
      return;
    }

    const updatedSeasons = seasons.map(s =>
      s.id === seasonId
        ? { ...s, isActive: false, endDate: new Date().toISOString() }
        : s
    );

    onUpdateSeasons(updatedSeasons, undefined);
  };

  const setActiveSeason = (seasonId: string) => {
    const updatedSeasons = seasons.map(s => ({
      ...s,
      isActive: s.id === seasonId,
    }));

    onUpdateSeasons(updatedSeasons, seasonId);
    setSelectedSeasonId(seasonId);
  };

  const deleteSeason = (seasonId: string) => {
    if (!confirm('Delete this season? This cannot be undone!')) {
      return;
    }

    const updatedSeasons = seasons.filter(s => s.id !== seasonId);
    let newCurrentId = currentSeasonId;

    if (currentSeasonId === seasonId) {
      const activeSeason = updatedSeasons.find(s => s.isActive);
      newCurrentId = activeSeason?.id;
    }

    onUpdateSeasons(updatedSeasons, newCurrentId);
    setSelectedSeasonId(newCurrentId || null);
  };

  const getSeasonStats = (season: Season) => {
    const seasonWars = allWars.filter(w => season.warIds.includes(w.id));
    return {
      totalWars: seasonWars.length,
      startDate: new Date(season.startDate).toLocaleDateString(),
      endDate: season.endDate ? new Date(season.endDate).toLocaleDateString() : 'Ongoing',
    };
  };

  const unassignedWars = allWars.filter(w => !seasons.some(s => s.warIds.includes(w.id)));

  const addWarToSeason = (seasonId: string, warId: string) => {
    const updatedSeasons = seasons.map(s =>
      s.id === seasonId
        ? { ...s, warIds: [...(s.warIds || []), warId] }
        : s
    );
    onUpdateSeasons(updatedSeasons, currentSeasonId);
  };

  const removeWarFromSeason = (seasonId: string, warId: string) => {
    const updatedSeasons = seasons.map(s =>
      s.id === seasonId
        ? { ...s, warIds: (s.warIds || []).filter(id => id !== warId) }
        : s
    );
    onUpdateSeasons(updatedSeasons, currentSeasonId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black uppercase tracking-wider text-white">Seasons</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Create Season Form */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-black text-white text-xs uppercase tracking-wider w-full transition-colors duration-200"
          >
            + New Season
          </button>
        ) : (
          <div className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700 space-y-2">
            <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Season #</label>
                <input
                  type="number"
                  value={newSeasonNumber}
                  onChange={(e) => setNewSeasonNumber(e.target.value)}
                  placeholder="64"
                  min="1"
                  className="w-20 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none text-sm text-center font-black"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Season Name</label>
                <input
                  type="text"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  placeholder="e.g. December 2025"
                  onKeyPress={(e) => e.key === 'Enter' && createSeason()}
                  className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createSeason}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-black text-white text-sm transition-colors duration-200"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSeasonName('');
                  setNewSeasonNumber('');
                }}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-black text-white text-sm transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Seasons List */}
        <div className="space-y-2">
          {seasons.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm font-medium">
              No seasons yet. Create one to start tracking!
            </div>
          ) : (
            seasons.map(season => {
              const stats = getSeasonStats(season);
              const seasonWars = allWars.filter(w => season.warIds.includes(w.id));

              return (
                <div
                  key={season.id}
                  onClick={() => setSelectedSeasonId(season.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedSeasonId === season.id
                      ? 'border-purple-500/50 bg-slate-800'
                      : 'border-slate-700 bg-slate-800/30 hover:border-purple-500/30'
                  }`}
                >
                  {/* Season Header */}
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {season.seasonNumber && (
                          <span className="text-xs font-black px-2 py-0.5 bg-purple-600/40 text-purple-300 rounded-lg border border-purple-500/30 uppercase tracking-wider">
                            S{season.seasonNumber}
                          </span>
                        )}
                        <h3 className="font-black text-white text-sm">{season.name}</h3>
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        {stats.startDate} to {stats.endDate}
                        {season.isActive && <span className="ml-2 text-green-300 font-black">● Active</span>}
                        {!season.isActive && season.endDate && (
                          <span className="ml-2 text-slate-500 font-semibold">○ Complete</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-cyan-300">{stats.totalWars}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">wars</div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedSeasonId === season.id && (
                    <div className="border-t border-slate-700 pt-3 mt-3 space-y-3">
                      {/* Wars in Season */}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-1">Wars ({seasonWars.length})</h4>
                        {seasonWars.length === 0 ? (
                          <div className="text-xs text-slate-400">None</div>
                        ) : (
                          <div className="space-y-1">
                            {seasonWars.map(war => (
                              <div key={war.id} className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg text-xs">
                                <span className="text-slate-300 font-medium">{war.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeWarFromSeason(season.id, war.id);
                                  }}
                                  className="text-red-400 hover:text-red-300 font-black"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Assign Unassigned Wars */}
                      {unassignedWars.length > 0 && (
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-1">Available Wars</h4>
                          <div className="space-y-1">
                            {unassignedWars.map(war => (
                              <div key={war.id} className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg text-xs">
                                <span className="text-slate-300 font-medium">{war.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addWarToSeason(season.id, war.id);
                                  }}
                                  className="text-green-400 hover:text-green-300 font-black"
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-slate-700">
                        {!season.isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSeason(season.id);
                            }}
                            className="flex-1 px-2 py-1 bg-green-600/80 hover:bg-green-600 rounded-lg font-black text-xs transition-colors duration-200"
                          >
                            Activate
                          </button>
                        )}
                        {season.isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              endSeason(season.id);
                            }}
                            className="flex-1 px-2 py-1 bg-yellow-600/80 hover:bg-yellow-600 rounded-lg font-black text-xs transition-colors duration-200"
                          >
                            End
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSeason(season.id);
                          }}
                          className="flex-1 px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded-lg font-black text-xs transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
