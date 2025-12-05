'use client';

interface BattlegroupTabsProps {
  currentBgIndex: number;
  onSwitchBg: (index: number) => void;
}

export default function BattlegroupTabs({ currentBgIndex, onSwitchBg }: BattlegroupTabsProps) {
  return (
    <div className="flex justify-center gap-2 mb-6">
      {[0, 1, 2].map((bgIndex) => (
        <button
          key={bgIndex}
          onClick={() => onSwitchBg(bgIndex)}
          className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
            currentBgIndex === bgIndex
              ? 'bg-purple-600 text-white shadow-lg scale-105'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          BG{bgIndex + 1}
        </button>
      ))}
    </div>
  );
}
