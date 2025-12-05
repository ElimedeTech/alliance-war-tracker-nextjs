import { War } from '@/types';

interface WarManagementProps {
  wars: War[];
  currentWarIndex: number;
  onAddWar: () => void;
  onSwitchWar: (index: number) => void;
  onDeleteWar: (index: number) => void;
}

export default function WarManagement({
  wars,
  currentWarIndex,
  onAddWar,
  onSwitchWar,
  onDeleteWar,
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

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="text-xl font-bold text-purple-300">Wars</h2>
        <button
          onClick={onAddWar}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>Add War</span>
        </button>
      </div>

      {wars.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {wars.map((war, index) => {
            const isActive = index === currentWarIndex;
            const formattedDate = formatDate(war.startDate);
            
            return (
              <div
                key={war.id}
                className={`flex items-center gap-2 rounded ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } transition`}
              >
                <button
                  onClick={() => onSwitchWar(index)}
                  className="px-4 py-2 font-bold flex-1 text-left"
                >
                  <div className="flex flex-col">
                    <span>{war.name}</span>
                    {formattedDate && (
                      <span className={`text-xs ${isActive ? 'text-purple-200' : 'text-gray-400'}`}>
                        📅 {formattedDate}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteWar(index)}
                  className={`px-3 py-2 hover:bg-red-600 hover:text-white rounded-r transition ${
                    isActive ? 'text-purple-200' : 'text-gray-400'
                  }`}
                  title="Delete this war"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}