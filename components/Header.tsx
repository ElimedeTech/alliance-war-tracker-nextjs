interface HeaderProps {
  allianceName: string;
  allianceTag: string;
  syncStatus: 'synced' | 'syncing' | 'error';
  saveMessage: string;
  userRole: 'leader' | 'officer';
  onVerifyKey: () => void;
  onShareLink: () => void;
  onChangeAlliance: () => void;
  onShowStats: () => void;
  onShowPlayerManagement: () => void;
  onShowWarComparison?: () => void;
  onShowSeasonManagement?: () => void;
  onShowSettings?: () => void;
}

export default function Header({
  allianceName,
  allianceTag,
  syncStatus,
  saveMessage,
  userRole,
  onVerifyKey,
  onShareLink,
  onChangeAlliance,
  onShowStats,
  onShowPlayerManagement,
  onShowWarComparison,
  onShowSeasonManagement,
  onShowSettings,
}: HeaderProps) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-4 mb-4 shadow-lg border border-slate-700/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Alliance Info */}
        <div className="p-3 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl border border-purple-500/30 flex-1">
          <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Currently Signed Into</div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-slate-200">
            🏛️ {allianceName}
          </h1>
          <div className="text-sm text-blue-300 font-semibold mt-1 flex items-center gap-2">
            {allianceTag && <span>Tag: {allianceTag}</span>}
            <span className={`text-xs font-black px-3 py-1 rounded-full ${
              userRole === 'leader' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {userRole === 'leader' ? 'Leader' : 'Officer'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {syncStatus === 'synced' && (
              <span className="text-green-400 text-xs flex items-center gap-1 font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Synced
              </span>
            )}
            {syncStatus === 'syncing' && (
              <span className="text-yellow-400 text-xs flex items-center gap-1 font-medium">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Syncing...
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="text-red-400 text-xs flex items-center gap-1 font-medium">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Sync Error
              </span>
            )}
            {saveMessage && (
              <span className="text-slate-400 text-xs">| {saveMessage}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onShowPlayerManagement}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black transition-colors duration-200 flex items-center gap-2 text-sm"
          >
            <span>👥</span>
            <span>Players</span>
          </button>

          <button
            onClick={onShowStats}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-black transition-colors duration-200 flex items-center gap-2 text-sm"
          >
            <span>📊</span>
            <span>Stats</span>
          </button>

          {onShowWarComparison && (
            <button
              onClick={onShowWarComparison}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-black transition-colors duration-200 flex items-center gap-2 text-sm"
            >
              <span>📊</span>
              <span>War Comparison</span>
            </button>
          )}

          {onShowSeasonManagement && (
            <button
              onClick={onShowSeasonManagement}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black transition-colors duration-200 flex items-center gap-2 text-sm"
            >
              <span>📅</span>
              <span>Seasons</span>
            </button>
          )}

          <button
            onClick={onShareLink}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black transition-colors duration-200 flex items-center gap-2 text-sm"
          >
            <span>🔗</span>
            <span>Share</span>
          </button>

          <button
            onClick={onChangeAlliance}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-black transition-colors duration-200 flex items-center gap-2 text-sm"
          >
            <span>🔄</span>
            <span>Change Alliance</span>
          </button>

          {onShowSettings && (
            <button
              onClick={onShowSettings}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-black transition-colors duration-200 flex items-center gap-2 text-sm border border-slate-600/50"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}