'use client';

import { War, Player } from '@/types';
import PathAssignmentPanel from './PathAssignmentPanel';

interface PathAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  war: War;
  bgIndex: number;
  players: Player[];
  onUpdateWar: (war: War) => void;
}

export default function PathAssignmentModal({
  isOpen,
  onClose,
  war,
  bgIndex,
  players,
  onUpdateWar,
}: PathAssignmentModalProps) {
  if (!isOpen) return null;

  const bgNumber = bgIndex + 1;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 border-b border-slate-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-200">Path Assignment</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              {war.name} · BG{bgNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <PathAssignmentPanel
          war={war}
          bgIndex={bgIndex}
          players={players}
          onUpdateWar={onUpdateWar}
        />

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 border-t border-slate-700 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-xl text-sm transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
