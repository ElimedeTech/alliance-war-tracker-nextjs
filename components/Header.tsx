interface HeaderProps {
  allianceName: string;
  allianceTag: string;
  syncStatus: 'synced' | 'syncing' | 'error';
  saveMessage: string;
  onVerifyKey: () => void;
  onShareLink: () => void;
  onChangeAlliance: () => void;
  onShowStats: () => void;
  onShowPlayerManagement: () => void;
  onShowWarComparison?: () => void; // NEW - Optional for backward compatibility
  onShowSeasonManagement?: () => void; // NEW - Optional for backward compatibility
}

export default function Header({
  allianceName,
  allianceTag,
  syncStatus,
  saveMessage,
  onVerifyKey,
  onShareLink,
  onChangeAlliance,
  onShowStats,
  onShowPlayerManagement,
  onShowWarComparison,
  onShowSeasonManagement,
}: HeaderProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Alliance Info */}
        <div className="p-3 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg border-2 border-purple-500/50 flex-1">
          <div className="text-sm text-gray-400 mb-1">Currently Signed Into</div>
          <h1 className="text-3xl font-bold text-purple-400">
            🏛️ {allianceName}
          </h1>
          <div className="text-lg text-blue-300 font-semibold mt-1">Tag: {allianceTag}</div>
          <div className="flex items-center gap-2 mt-2">
            {syncStatus === 'synced' && (
              <span className="text-green-400 text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Synced
              </span>
            )}
            {syncStatus === 'syncing' && (
              <span className="text-yellow-400 text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Syncing...
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="text-red-400 text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Sync Error
              </span>
            )}
            {saveMessage && (
              <span className="text-gray-400 text-sm">| {saveMessage}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Player Management */}
          <button
            onClick={onShowPlayerManagement}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition flex items-center gap-2"
          >
            <span>👥</span>
            <span>Players</span>
          </button>

          {/* Stats */}
          <button
            onClick={onShowStats}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition flex items-center gap-2"
          >
            <span>📊</span>
            <span>Stats</span>
          </button>

          {/* War Comparison - NEW */}
          {onShowWarComparison && (
            <button
              onClick={onShowWarComparison}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-bold transition flex items-center gap-2"
            >
              <span>📊</span>
              <span>War Comparison</span>
            </button>
          )}

          {/* Season Management - NEW */}
          {onShowSeasonManagement && (
            <button
              onClick={onShowSeasonManagement}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition flex items-center gap-2"
            >
              <span>📅</span>
              <span>Seasons</span>
            </button>
          )}

          {/* Share Link */}
          <button
            onClick={onShareLink}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold transition flex items-center gap-2"
          >
            <span>🔗</span>
            <span>Share</span>
          </button>

          {/* Change Alliance */}
          <button
            onClick={onChangeAlliance}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-bold transition flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Change Alliance</span>
          </button>
        </div>
      </div>
    </div>
  );
}