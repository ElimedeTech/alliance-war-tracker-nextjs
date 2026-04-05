"use client";

/**
 * AllianceSettingsModal.tsx
 *
 * Lets leaders/officers edit:
 *  - Alliance name
 *  - Alliance tag (short code e.g. [NGHT])
 *  - Battlegroup colours (colour picker per BG)
 *
 * Changes are saved back to Firebase via the onSave callback,
 * which should call your existing Firebase update logic in MainApp.
 *
 * USAGE in MainApp:
 *
 *   const [showSettings, setShowSettings] = useState(false);
 *
 *   <AllianceSettingsModal
 *     isOpen={showSettings}
 *     onClose={() => setShowSettings(false)}
 *     allianceName={data.allianceName}
 *     allianceTag={data.allianceTag}
 *     bgColors={data.bgColors ?? DEFAULT_BG_COLORS}
 *     onSave={(updates) => {
 *       updateData({ ...data, ...updates });   // your Firebase save fn
 *       setShowSettings(false);
 *     }}
 *   />
 */

import { useState } from 'react';
import { BgColors, DEFAULT_BG_COLORS } from '@/types';

// ─── Preset colour swatches ────────────────────────────────────────────────────

const SWATCHES: Record<string, string[]> = {
  'Reds':    ['#ef4444', '#f97316', '#dc2626', '#be123c', '#9f1239'],
  'Greens':  ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac'],
  'Blues':   ['#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa', '#93c5fd'],
  'Purples': ['#a855f7', '#9333ea', '#7c3aed', '#c084fc', '#d8b4fe'],
  'Others':  ['#f59e0b', '#eab308', '#06b6d4', '#14b8a6', '#ec4899'],
};

// ─── Colour picker row ────────────────────────────────────────────────────────

function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {/* Native colour input — opens OS colour picker */}
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
            style={{ padding: 0 }}
          />
          <span className="text-xs font-mono text-slate-400 w-[64px]">{value}</span>
        </div>
      </div>

      {/* Swatches */}
      <div className="space-y-1.5">
        {Object.entries(SWATCHES).map(([group, swatches]) => (
          <div key={group} className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-600 w-12 shrink-0 uppercase font-bold">
              {group}
            </span>
            <div className="flex gap-1">
              {swatches.map((hex) => (
                <button
                  key={hex}
                  onClick={() => onChange(hex)}
                  className="w-5 h-5 rounded-md transition-transform hover:scale-110 shrink-0"
                  style={{
                    backgroundColor: hex,
                    border: value === hex ? '2px solid white' : '2px solid transparent',
                    boxShadow: value === hex ? `0 0 6px ${hex}` : undefined,
                  }}
                  title={hex}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Live preview bar */}
      <div
        className="h-1.5 rounded-full transition-all duration-300"
        style={{ backgroundColor: value }}
      />
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export interface AllianceSettingsUpdate {
  allianceName: string;
  allianceTag: string;
  bgColors: BgColors;
  pathAssignmentMode: 'split' | 'single';
}

interface AllianceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allianceName: string;
  allianceTag: string;
  bgColors: BgColors;
  pathAssignmentMode?: 'split' | 'single';
  userRole?: 'leader' | 'officer';
  leaderKey?: string;
  officerKey?: string;
  onSave: (updates: AllianceSettingsUpdate) => void;
  onGenerateOfficerKey?: () => Promise<void>;
}

export function AllianceSettingsModal({
  isOpen,
  onClose,
  allianceName,
  allianceTag,
  bgColors,
  pathAssignmentMode = 'split',
  userRole = 'leader',
  leaderKey,
  officerKey,
  onSave,
  onGenerateOfficerKey,
}: AllianceSettingsModalProps) {
  const [name, setName] = useState(allianceName ?? '');
  const [tag, setTag] = useState(allianceTag ?? '');
  const [copiedKey, setCopiedKey] = useState<'leader' | 'officer' | null>(null);
  const [colors, setColors] = useState<BgColors>({ ...bgColors });
  const [pathMode, setPathMode] = useState<'split' | 'single'>(pathAssignmentMode);
  const [generatingKey, setGeneratingKey] = useState(false);

  const isLeader = userRole === 'leader';

  const copyKey = (key: string, which: 'leader' | 'officer') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key).then(() => {
        setCopiedKey(which);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    } else {
      prompt('Copy this key:', key);
    }
  };

  if (!isOpen) return null;

  const setColor = (bg: 1 | 2 | 3) => (hex: string) => {
    setColors((prev) => ({ ...prev, [bg]: hex }));
  };

  const handleSave = () => {
    onSave({
      allianceName: isLeader ? (name.trim() || allianceName) : allianceName,
      allianceTag: isLeader ? tag.trim() : allianceTag,
      bgColors: colors,
      pathAssignmentMode: pathMode,
    });
  };

  const hasChanges =
    (isLeader && (name !== allianceName || tag !== allianceTag)) ||
    colors[1] !== bgColors[1] ||
    colors[2] !== bgColors[2] ||
    colors[3] !== bgColors[3] ||
    pathMode !== pathAssignmentMode;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700/50">

        {/* Header */}
        <div className="sticky top-0 bg-slate-800/95 border-b border-slate-700 px-5 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              ⚙️ Alliance Settings
            </h2>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Name, tag, and battlegroup colours
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-7">

          {/* ── Alliance Keys (leader only) ──────────────────────────────── */}
          {isLeader && (
            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">
                Alliance Keys
              </h3>

              {leaderKey && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-500/25 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300">👑 Leader Key (keep private)</span>
                    <button
                      onClick={() => copyKey(leaderKey, 'leader')}
                      className="text-[10px] font-black text-yellow-400 hover:text-yellow-200 px-2 py-0.5 bg-yellow-900/40 rounded-lg transition"
                    >
                      {copiedKey === 'leader' ? '✅ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="font-mono font-black text-lg text-white tracking-widest">{leaderKey}</p>
                </div>
              )}

              {officerKey ? (
                <div className="p-3 bg-blue-900/20 border border-blue-500/25 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">🛡️ Officer Key (share with officers)</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyKey(officerKey, 'officer')}
                        className="text-[10px] font-black text-blue-400 hover:text-blue-200 px-2 py-0.5 bg-blue-900/40 rounded-lg transition"
                      >
                        {copiedKey === 'officer' ? '✅ Copied' : 'Copy'}
                      </button>
                      {onGenerateOfficerKey && (
                        <button
                          onClick={async () => {
                            if (!confirm('Generate a new officer key? The old key will stop working.')) return;
                            setGeneratingKey(true);
                            await onGenerateOfficerKey();
                            setGeneratingKey(false);
                          }}
                          disabled={generatingKey}
                          className="text-[10px] font-black text-slate-400 hover:text-slate-200 px-2 py-0.5 bg-slate-700/60 rounded-lg transition disabled:opacity-40"
                        >
                          {generatingKey ? '...' : 'Regenerate'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-mono font-black text-lg text-white tracking-widest">{officerKey}</p>
                </div>
              ) : (
                onGenerateOfficerKey && (
                  <div className="p-3 bg-slate-800/60 border border-slate-600/40 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-medium mb-2">No officer key yet. Generate one to share access with officers.</p>
                    <button
                      onClick={async () => {
                        setGeneratingKey(true);
                        await onGenerateOfficerKey();
                        setGeneratingKey(false);
                      }}
                      disabled={generatingKey}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black rounded-lg text-xs transition"
                    >
                      {generatingKey ? 'Generating...' : '🛡️ Generate Officer Key'}
                    </button>
                  </div>
                )
              )}
            </section>
          )}

          {/* ── Identity (leader only) ───────────────────────────────────── */}
          {isLeader && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">
                Alliance Identity
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Alliance Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder="e.g. Night Guardians"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none transition-colors font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Alliance Tag
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value.toUpperCase().slice(0, 5))}
                    maxLength={5}
                    placeholder="e.g. NGHT"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-blue-300 placeholder-slate-600 focus:border-purple-500 focus:outline-none transition-colors font-black uppercase tracking-widest pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 font-bold">
                    {tag.length}/5
                  </span>
                </div>
                <p className="text-[10px] text-slate-600">
                  Short code shown in the header. Max 5 characters.
                </p>
              </div>

              {/* Live preview */}
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl p-3">
                <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Preview</p>
                <p className="text-base font-black uppercase tracking-wider text-slate-200">
                  🏛️ {name || <span className="text-slate-600">Alliance Name</span>}
                </p>
                {tag && (
                  <p className="text-xs text-blue-300 font-semibold mt-0.5">
                    Tag: {tag}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ── Path Assignment Mode ───────────────────────────────────── */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">
              Path Assignment Mode
            </h3>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Choose how paths are assigned to players in each battlegroup.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPathMode('split')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  pathMode === 'split'
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-black uppercase tracking-wider text-white mb-1">Split Sections</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  Assign players separately for Section 1 and Section 2. Different players can cover each section of a path.
                </div>
                {pathMode === 'split' && (
                  <div className="mt-2 text-[10px] font-black text-purple-300 uppercase tracking-wider">✓ Active</div>
                )}
              </button>
              <button
                onClick={() => setPathMode('single')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  pathMode === 'single'
                    ? 'border-cyan-500 bg-cyan-900/30'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-black uppercase tracking-wider text-white mb-1">Single Path</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  Assign one player per path — they cover both sections automatically (4 fights per path).
                </div>
                {pathMode === 'single' && (
                  <div className="mt-2 text-[10px] font-black text-cyan-300 uppercase tracking-wider">✓ Active</div>
                )}
              </button>
            </div>
          </section>

          {/* ── BG Colours ──────────────────────────────────────────────── */}
          <section className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">
              Battlegroup Colours
            </h3>

            {/* Combined preview */}
            <div className="flex gap-2 h-2 rounded-full overflow-hidden">
              <div className="flex-1 rounded-full transition-all" style={{ backgroundColor: colors[1] }} />
              <div className="flex-1 rounded-full transition-all" style={{ backgroundColor: colors[2] }} />
              <div className="flex-1 rounded-full transition-all" style={{ backgroundColor: colors[3] }} />
            </div>

            <ColorPickerField
              label="Battlegroup 1"
              value={colors[1]}
              onChange={setColor(1)}
            />
            <ColorPickerField
              label="Battlegroup 2"
              value={colors[2]}
              onChange={setColor(2)}
            />
            <ColorPickerField
              label="Battlegroup 3"
              value={colors[3]}
              onChange={setColor(3)}
            />

            <button
              onClick={() => setColors({ ...DEFAULT_BG_COLORS })}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-bold"
            >
              ↺ Reset to defaults
            </button>
          </section>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1 px-4 py-2.5 rounded-xl font-black transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: hasChanges ? '#9333ea' : undefined,
                color: 'white',
              }}
            >
              {hasChanges ? '💾 Save Changes' : 'No Changes'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}