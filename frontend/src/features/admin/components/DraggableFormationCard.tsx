import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  MoreVertical, 
  BookOpen, 
  Clock, 
  Database, 
  HelpCircle, 
  Edit, 
  Trash2, 
  FolderOpen, 
  Settings, 
  UserPlus, 
  Move,
  GripVertical
} from 'lucide-react';
import { Formation } from '../types';
import { getFormationCoverImageUrl } from '../../../utils/imageUtils';

interface DraggableFormationCardProps {
  formation: Formation;
  formationStats: { bankCount: number; userCount: number };
  isAdmin: boolean;
  activeDropdown: string | null;
  onToggleDropdown: (id: string | null) => void;
  onFormationClick: (formation: Formation) => void;
  onLessonsClick: (formation: Formation, e: React.MouseEvent) => void;
  onBanksClick: (formation: Formation, e: React.MouseEvent) => void;
  onConfigureQuiz: (formation: Formation) => void;
  onToggleActive: (formation: Formation) => void;
  onManageContent: (formation: Formation) => void;
  onEditFormation: (formation: Formation) => void;
  onDeleteFormation: (formation: Formation) => void;
  onAssignFormation: (formation: Formation) => void;
  onMoveFormation: (formation: Formation) => void;
  formatFormationTitle: (title: string) => string;
  formatFormationDescription: (description: string | undefined) => string;
  formatDuration: (minutes: number) => string;
  getStatusIcon: (isActive: boolean) => React.ReactNode;
}

const DraggableFormationCard: React.FC<DraggableFormationCardProps> = ({
  formation,
  formationStats,
  isAdmin,
  activeDropdown,
  onToggleDropdown,
  onFormationClick,
  onLessonsClick,
  onBanksClick,
  onConfigureQuiz,
  onToggleActive,
  onManageContent,
  onEditFormation,
  onDeleteFormation,
  onAssignFormation,
  onMoveFormation,
  formatFormationTitle,
  formatFormationDescription,
  formatDuration,
  getStatusIcon
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: formation.id,
    disabled: false
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gradient-to-b from-white to-blue-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative"
    >
      {/* Handle de drag - Zone dédiée pour le drag */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 w-6 h-6 cursor-grab active:cursor-grabbing z-10 flex items-center justify-center bg-white/80 rounded-full hover:bg-white transition-colors"
        title="Glisser pour réorganiser"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3 text-gray-500" />
      </div>

      {/* Menu Admin (3 points) - Visible uniquement pour les admins */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDropdown(activeDropdown === formation.id ? null : formation.id);
            }}
            className="dropdown-trigger p-1 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
            title="Actions d'administration"
          >
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </button>

          {/* Menu déroulant */}
          {activeDropdown === formation.id && (
            <div className="dropdown-menu absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onManageContent(formation);
                  onToggleDropdown(null);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Gérer le contenu
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigureQuiz(formation);
                  onToggleDropdown(null);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurer le quiz
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignFormation(formation);
                  onToggleDropdown(null);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assigner
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditFormation(formation);
                  onToggleDropdown(null);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier la formation
              </button>

              <div className="border-t border-gray-200 my-1"></div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveFormation(formation);
                  onToggleDropdown(null);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Move className="h-4 w-4 mr-2" />
                Déplacer
              </button>

              <div className="border-t border-gray-200 my-1"></div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFormation(formation);
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

      <div className="relative h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden group">
        {formation.coverImage ? (
          <img
            src={getFormationCoverImageUrl(formation.coverImage)}
            alt={`Couverture de ${formation.title}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('❌ Erreur de chargement de l\'image de couverture:', formation.coverImage);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}

        {/* Fallback si pas d'image */}
        <div className={`w-full h-full flex items-center justify-center ${formation.coverImage ? 'hidden' : ''}`}>
          <BookOpen className="h-12 w-12 text-gray-400" />
        </div>

        {/* Badge de statut - Visible uniquement pour les admins */}
        {isAdmin && (
          <div className="absolute top-2 left-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(formation);
              }}
              className="cursor-pointer"
            >
              {getStatusIcon(formation.isActive)}
            </button>
          </div>
        )}

        {/* Statistiques au survol - Visible uniquement pour les admins */}
        {isAdmin && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex items-center space-x-6 text-white">
              <div
                className="flex flex-col items-center hover:text-blue-300 transition-colors cursor-pointer"
                onClick={(e) => onLessonsClick(formation, e)}
                title={`${formation.lessonCount || 0} leçon(s)`}
              >
                <BookOpen className="h-4 w-4 mb-1" />
                <span className="text-xs">{formation.lessonCount || 0}</span>
              </div>

              <div
                className="flex flex-col items-center hover:text-blue-300 transition-colors cursor-pointer"
                onClick={(e) => onBanksClick(formation, e)}
                title={`${formationStats.bankCount || 0} banque(s)`}
              >
                <Database className="h-4 w-4 mb-1" />
                <span className="text-xs">{formationStats.bankCount || 0}</span>
              </div>

              <div
                className="flex flex-col items-center hover:text-yellow-300 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigureQuiz(formation);
                }}
                title={formation.hasQuiz ? 'Quiz configuré - Cliquer pour modifier' : 'Quiz non configuré - Cliquer pour configurer'}
              >
                <HelpCircle className={`h-4 w-4 mb-1 ${
                  formation.hasQuiz
                    ? 'text-yellow-300'
                    : 'text-white/70'
                }`} />
                <span className="text-xs">Quiz</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenu de la carte */}
      <div className="space-y-2">
        {/* Titre et durée */}
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1 pr-2">
            {formatFormationTitle(formation.title)}
          </h3>
          <div className="flex items-center text-gray-600 flex-shrink-0">
            <Clock className="h-3 w-3 mr-1" />
            <span className="text-xs">
              {formatDuration(formation.totalDuration || formation.duration)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-2">
          {formatFormationDescription(formation.description)}
        </p>

        {/* Action principale - Voir la formation */}
        <div className="pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFormationClick(formation);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
            title="Voir la formation"
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Voir
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraggableFormationCard;