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
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-purple-300">Path Assignment</h2>
            <p className="text-gray-400 text-sm mt-1">
              {war.name} • BG{bgNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
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
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
