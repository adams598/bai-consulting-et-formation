import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Folder 
} from 'lucide-react';
import { Universe } from '../types';

interface DraggableUniverseCardProps {
  universe: Universe;
  isAdmin: boolean;
  activeDropdown: string | null;
  onToggleDropdown: (id: string | null) => void;
  onEnterUniverse: (universe: Universe) => void;
  onEditUniverse: (universe: Universe) => void;
  onDeleteUniverse: (universe: Universe) => void;
}

const DraggableUniverseCard: React.FC<DraggableUniverseCardProps> = ({
  universe,
  isAdmin,
  activeDropdown,
  onToggleDropdown,
  onEnterUniverse,
  onEditUniverse,
  onDeleteUniverse
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: universe.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="draggable-universe universe-folder-card group cursor-grab active:cursor-grabbing relative"
      data-universe-id={universe.id}
      style={{
        ...style,
        '--universe-color': universe.id === 'fsu' 
          ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
          : `linear-gradient(135deg, ${universe.color} 0%, ${universe.color}CC 100%)`,
        '--universe-tab-color': universe.id === 'fsu' 
          ? '#6B7280'
          : universe.color
      } as React.CSSProperties}
      onClick={() => onEnterUniverse(universe)}
    >
      {/* Indicateur de drag */}
      <div className="absolute top-2 left-2 w-2 h-2 bg-gray-400 rounded-full opacity-50"></div>

      {/* Menu contextuel - Visible uniquement pour les admins et au survol */}
      {isAdmin && universe.id !== 'fsu' && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDropdown(activeDropdown === universe.id ? null : universe.id);
            }}
            className="universe-menu-trigger p-1 bg-white/90 hover:bg-white rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
            title="Actions d'administration"
          >
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </button>
        
          {/* Menu déroulant */}
          {activeDropdown === universe.id && (
            <div className="universe-menu absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditUniverse(universe);
                  onToggleDropdown(null);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteUniverse(universe);
                  onToggleDropdown(null);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Icône dossier Windows */}
      <div className="universe-folder-icon">
        <div className="folder-body">
          <div className="folder-tab"></div>
          <div className="folder-content">
            {(universe.formationCount ?? 0) > 0 && (
              <div className="folder-document">
                <div className="document-icon"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Nom de l'univers */}
      <div className="universe-folder-name">
        {universe.name}
      </div>
      
      {/* Compteur de formations */}
      <div className="universe-folder-count">
        {universe.formationCount ?? 0} formation{(universe.formationCount ?? 0) > 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default DraggableUniverseCard;
