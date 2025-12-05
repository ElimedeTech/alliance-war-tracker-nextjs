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
      startDate: new Date().toISOString(),
      warIds: [],
      isActive: true,
    };

    // Deactivate all other seasons
    const updatedSeasons = seasons.map(s => ({ ...s, isActive: false }));
    updatedSeasons.push(newSeason);

    onUpdateSeasons(updatedSeasons, newSeason.id);
    setNewSeasonName('');
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
      <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">Season Management</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold"
          >
            Close
          </button>
        </div>

        {/* Create Season Form */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-white"
          >
            ➕ Create New Season
          </button>
        ) : (
          <div className="mb-6 p-4 bg-slate-700 rounded-lg border-2 border-green-500">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="Season name (e.g., Season 1, December 2025)"
                onKeyPress={(e) => e.key === 'Enter' && createSeason()}
                className="flex-1 px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-green-400 focus:outline-none"
              />
              <button
                onClick={createSeason}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold text-white"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSeasonName('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Seasons List */}
        <div className="space-y-4">
          {seasons.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No seasons created yet. Create one to get started!
            </div>
          ) : (
            seasons.map(season => {
              const stats = getSeasonStats(season);
              const seasonWars = allWars.filter(w => season.warIds.includes(w.id));

              return (
                <div
                  key={season.id}
                  onClick={() => setSelectedSeasonId(season.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedSeasonId === season.id
                      ? 'border-purple-500 bg-slate-700/80'
                      : 'border-slate-600 bg-slate-700/50 hover:border-purple-500/50'
                  }`}
                >
                  {/* Season Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{season.name}</h3>
                      <div className="text-sm text-gray-400">
                        {stats.startDate} to {stats.endDate}
                        {season.isActive && <span className="ml-2 text-green-400">🔴 Active</span>}
                        {!season.isActive && season.endDate && (
                          <span className="ml-2 text-gray-500">⚫ Complete</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-cyan-300">{stats.totalWars}</div>
                      <div className="text-xs text-gray-400">Wars</div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedSeasonId === season.id && (
                    <div className="border-t border-slate-600 pt-4 mt-4">
                      {/* Wars in Season */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-white mb-2">Wars in Season ({seasonWars.length})</h4>
                        {seasonWars.length === 0 ? (
                          <div className="text-sm text-gray-400">No wars assigned yet</div>
                        ) : (
                          <div className="space-y-2">
                            {seasonWars.map(war => (
                              <div
                                key={war.id}
                                className="flex justify-between items-center p-2 bg-slate-600/50 rounded text-sm"
                              >
                                <span>{war.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeWarFromSeason(season.id, war.id);
                                  }}
                                  className="px-2 py-1 bg-red-600/50 hover:bg-red-600 rounded text-xs"
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
                        <div className="mb-4">
                          <h4 className="font-semibold text-white mb-2">Add Wars to Season</h4>
                          <div className="space-y-2">
                            {unassignedWars.map(war => (
                              <div
                                key={war.id}
                                className="flex justify-between items-center p-2 bg-slate-600/50 rounded text-sm"
                              >
                                <span>{war.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addWarToSeason(season.id, war.id);
                                  }}
                                  className="px-2 py-1 bg-green-600/50 hover:bg-green-600 rounded text-xs"
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-slate-600">
                        {!season.isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSeason(season.id);
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold text-sm"
                          >
                            Set Active
                          </button>
                        )}
                        {season.isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              endSeason(season.id);
                            }}
                            className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-semibold text-sm"
                          >
                            End Season
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSeason(season.id);
                          }}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold text-sm"
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
