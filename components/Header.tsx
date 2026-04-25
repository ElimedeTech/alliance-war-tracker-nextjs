interface HeaderProps {
  allianceName: string;
  allianceTag: string;
  syncStatus: 'synced' | 'syncing' | 'error';
  saveMessage: string;
  userRole: 'leader' | 'officer';
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
  onShareLink,
  onChangeAlliance,
  onShowStats,
  onShowPlayerManagement,
  onShowWarComparison,
  onShowSeasonManagement,
  onShowSettings,
}: HeaderProps) {
  const syncColor = syncStatus === 'synced' ? 'text-green-400' : syncStatus === 'syncing' ? 'text-yellow-400' : 'text-red-400';
  const syncDot = syncStatus === 'synced' ? 'bg-green-400' : syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400';
  const syncLabel = syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Sync Error';

  const actions = [
    { label: 'Players',  icon: '👥', color: 'blue',   onClick: onShowPlayerManagement },
    { label: 'Stats',    icon: '📊', color: 'green',  onClick: onShowStats },
    { label: 'Compare',  icon: '⚔️', color: 'yellow', onClick: onShowWarComparison },
    { label: 'Seasons',  icon: '📅', color: 'purple', onClick: onShowSeasonManagement },
    { label: 'Share',    icon: '🔗', color: 'pink',   onClick: onShareLink },
    { label: 'Settings', icon: '⚙️', color: 'slate',  onClick: onShowSettings },
  ].filter(a => a.onClick != null) as { label: string; icon: string; color: string; onClick: () => void }[];

  const colorMap: Record<string, string> = {
    blue:   'bg-blue-500/10   hover:bg-blue-500/20   border-blue-500/20   hover:border-blue-500/40   text-blue-300',
    green:  'bg-green-500/10  hover:bg-green-500/20  border-green-500/20  hover:border-green-500/40  text-green-300',
    yellow: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 hover:border-yellow-500/40 text-yellow-300',
    purple: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/40 text-purple-300',
    pink:   'bg-pink-500/10   hover:bg-pink-500/20   border-pink-500/20   hover:border-pink-500/40   text-pink-300',
    slate:  'bg-slate-500/10  hover:bg-slate-500/20  border-slate-500/20  hover:border-slate-500/40  text-slate-300',
  };

  return (
    <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-2xl p-4 mb-4 shadow-xl border border-slate-700/40">

      {/* Alliance Info */}
      <div className="mb-4">
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1.5">
          Currently signed into
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xl">🏛️</span>
          <h1 className="text-xl font-black uppercase tracking-wider text-white">
            {allianceName}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {allianceTag && (
            <span className="text-xs text-slate-400 font-semibold">{allianceTag}</span>
          )}
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
            userRole === 'leader'
              ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
              : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          }`}>
            {userRole === 'leader' ? 'Leader' : 'Officer'}
          </span>
          <span className={`text-[10px] flex items-center gap-1 font-medium ${syncColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${syncDot}`} />
            {syncLabel}
          </span>
          {saveMessage && (
            <span className="text-[10px] text-slate-500">{saveMessage}</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700/50 mb-3" />

      {/* Action Grid */}
      <div className="grid grid-cols-3 gap-2">
        {actions.map(({ label, icon, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 border rounded-xl transition-all duration-200 ${colorMap[color]}`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
          </button>
        ))}
      </div>

      {/* Change Alliance — subtle footer */}
      <button
        onClick={onChangeAlliance}
        className="w-full mt-3 py-1.5 text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors duration-200 flex items-center justify-center gap-1.5"
      >
        <span>🔄</span> Change Alliance
      </button>
    </div>
  );
}