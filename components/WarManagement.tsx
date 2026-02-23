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
  const handleDeleteWar = (index: number) => {
    const warToDelete = wars[index];
    const warName = warToDelete.name;
    const warDate = warToDelete.startDate || 'No date';

    if (confirm(`Are you sure you want to delete "${warName}" (${warDate})?\n\nThis action cannot be undone.`)) {
      onDeleteWar(index);
    }
  };

  // Format date for display (DD/MM/YYYY)
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
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
    if (!currentWar.allianceResult || currentWar.allianceResult === 'pending') {
      alert('Please select a war result (Win/Loss) before closing the war.');
      return;
    }

    if (confirm(`Close war "${currentWar.name}"? It will be locked and only leaders/officers can edit it.`)) {
      if (onUpdateWar) {
        onUpdateWar(currentWarIndex, {
          isClosed: true,
          endDate: new Date().toISOString().split('T')[0]
        });
      }
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
            {wars.map((war, index) => {
              const isActive = index === currentWarIndex;
              const formattedDate = formatDate(war.startDate);

              return (
                <div
                  key={war.id}
                  className={`flex items-center gap-2 rounded-xl ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } transition-colors duration-200 ${war.isClosed ? 'opacity-75 border border-yellow-500/50' : ''}`}
                >
                  <button
                    onClick={() => onSwitchWar(index)}
                    className="px-4 py-2 font-bold flex-1 text-left text-sm"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span>{war.name}</span>
                        {war.isClosed && <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded-lg">🔒 Closed</span>}
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
            })}
          </div>

          {/* War Result Selector and Close Button */}
          {currentWar && (
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/30">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">Manage: {currentWar.name}</h3>

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
                  {currentWar.isClosed ? (
                    <div className="px-3 py-2 rounded-lg bg-yellow-900/50 text-yellow-200 font-black text-xs text-center border border-yellow-600/30">
                      🔒 War Closed
                    </div>
                  ) : (
                    <button
                      onClick={handleCloseWar}
                      className="w-full px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition-colors duration-200"
                    >
                      🔒 Close War
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
