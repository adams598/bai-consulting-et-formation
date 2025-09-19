import React from 'react';
import { CheckCircle, Circle, Clock, Award } from 'lucide-react';

interface ProgressBarProps {
  progress: number; // 0-100
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  showLabel?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'circular' | 'stepped';
  steps?: Array<{
    id: string;
    label: string;
    completed: boolean;
    current?: boolean;
  }>;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'not_started',
  showLabel = true,
  showIcon = false,
  size = 'md',
  variant = 'default',
  steps,
  className = ''
}) => {
  // Configuration des tailles
  const sizeConfig = {
    sm: { height: 'h-1', text: 'text-xs' },
    md: { height: 'h-2', text: 'text-sm' },
    lg: { height: 'h-3', text: 'text-base' }
  };

  // Configuration des couleurs selon le statut
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Barre de progression circulaire
  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 45; // rayon de 45
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
          {/* Cercle de fond */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          {/* Cercle de progression */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={getStatusColor().replace('bg-', 'text-')}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        
        {/* Texte au centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {showIcon && getStatusIcon()}
            {showLabel && (
              <div className={`font-semibold ${sizeConfig[size].text}`}>
                {Math.round(progress)}%
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Barre de progression par étapes
  if (variant === 'stepped' && steps) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Cercle d'étape */}
              <div className="relative flex items-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : step.current
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                
                {/* Label d'étape */}
                {showLabel && (
                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
                    <span className={`text-xs whitespace-nowrap ${
                      step.completed || step.current ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Ligne de connexion */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Barre de progression standard
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            {showIcon && getStatusIcon()}
            <span className={`font-medium text-gray-700 ${sizeConfig[size].text}`}>
              Progression
            </span>
          </div>
          <span className={`text-gray-500 ${sizeConfig[size].text}`}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
      
      <div className={`w-full ${sizeConfig[size].height} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`${sizeConfig[size].height} ${getStatusColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      
      {/* Informations additionnelles */}
      {status === 'completed' && showLabel && (
        <div className="flex items-center mt-2 text-green-600">
          <Award className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Formation terminée !</span>
        </div>
      )}
      
      {status === 'overdue' && showLabel && (
        <div className="flex items-center mt-2 text-red-600">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Formation en retard</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
