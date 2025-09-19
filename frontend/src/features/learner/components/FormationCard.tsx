import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Award, Calendar, ChevronRight, Play } from 'lucide-react';
import { LearnerFormationAssignment, FormationStatus } from '../types';

interface FormationCardProps {
  assignment: LearnerFormationAssignment;
  variant?: 'default' | 'compact' | 'detailed';
  showProgress?: boolean;
  onClick?: () => void;
}

const FormationCard: React.FC<FormationCardProps> = ({
  assignment,
  variant = 'default',
  showProgress = true,
  onClick
}) => {
  const { formation, status, progress, dueDate } = assignment;

  // Calcul du pourcentage de progression
  const progressPercent = progress?.progress || 0;

  // Couleurs selon le statut
  const getStatusColor = (status: FormationStatus) => {
    switch (status) {
      case FormationStatus.NOT_STARTED:
        return 'bg-gray-500';
      case FormationStatus.IN_PROGRESS:
        return 'bg-blue-500';
      case FormationStatus.COMPLETED:
        return 'bg-green-500';
      case FormationStatus.OVERDUE:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: FormationStatus) => {
    switch (status) {
      case FormationStatus.NOT_STARTED:
        return 'Non commencée';
      case FormationStatus.IN_PROGRESS:
        return 'En cours';
      case FormationStatus.COMPLETED:
        return 'Terminée';
      case FormationStatus.OVERDUE:
        return 'En retard';
      default:
        return 'Statut inconnu';
    }
  };

  // Format de durée
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  // Date d'échéance formatée
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== FormationStatus.COMPLETED;

  if (variant === 'compact') {
    return (
      <div 
        className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${
          onClick ? 'hover:border-blue-300' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {formation.title}
            </h3>
            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(formation.duration)}
              </span>
              <span className={`px-2 py-1 rounded-full text-white ${getStatusColor(status)}`}>
                {getStatusLabel(status)}
              </span>
            </div>
          </div>
          {showProgress && status === FormationStatus.IN_PROGRESS && (
            <div className="ml-4">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">{progressPercent}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image de couverture */}
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        {formation.coverImage ? (
          <img
            src={formation.coverImage}
            alt={formation.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback si l'image ne charge pas
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
            <BookOpen className="h-16 w-16 text-white opacity-50" />
          </div>
        )}
        
        {/* Badge de statut */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>

        {/* Badge en retard */}
        {isOverdue && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full bg-red-500 text-white text-sm font-medium">
              En retard
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {formation.title}
          </h3>
          
          {variant === 'detailed' && formation.description && (
            <p className="text-gray-600 text-sm line-clamp-3 mb-4">
              {formation.description}
            </p>
          )}

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDuration(formation.duration)}
            </span>
            
            {formation.organization && (
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {formation.organization}
              </span>
            )}
            
            {dueDate && (
              <span className={`flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="h-4 w-4 mr-1" />
                Échéance: {formatDueDate(dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        {showProgress && status !== FormationStatus.NOT_STARTED && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progression</span>
              <span className="text-sm text-gray-500">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  status === FormationStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {progress?.lastAccessedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Dernière activité: {new Date(progress.lastAccessedAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {formation.hasQuiz && (
              <div className="flex items-center text-xs text-gray-500">
                <Award className="h-3 w-3 mr-1" />
                Quiz inclus
              </div>
            )}
          </div>
          
          <Link
            to={`/apprenant/courses/${formation.id}`}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === FormationStatus.NOT_STARTED
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : status === FormationStatus.IN_PROGRESS
                ? 'bg-green-600 text-white hover:bg-green-700'
                : status === FormationStatus.COMPLETED
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {status === FormationStatus.NOT_STARTED && (
              <>
                <Play className="h-4 w-4 mr-2" />
                Commencer
              </>
            )}
            {status === FormationStatus.IN_PROGRESS && (
              <>
                Continuer
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
            {status === FormationStatus.COMPLETED && (
              <>
                Revoir
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
            {status === FormationStatus.OVERDUE && (
              <>
                Reprendre
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FormationCard;
