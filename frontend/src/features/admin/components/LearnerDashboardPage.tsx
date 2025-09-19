import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  BarChart3
} from 'lucide-react';
import '../styles/admin-typography.css';
import { authService } from '../../../services/authService';

interface LearnerStats {
  totalFormations: number;
  completedFormations: number;
  inProgressFormations: number;
  pendingFormations: number;
  certificatesEarned: number;
  totalTimeSpent: number; // en minutes
  averageScore: number;
}

interface RecentActivity {
  id: string;
  type: 'formation_started' | 'formation_completed' | 'certificate_earned' | 'quiz_passed';
  title: string;
  description: string;
  timestamp: Date;
  formationId?: string;
}

interface UpcomingDeadline {
  id: string;
  formationTitle: string;
  dueDate: Date;
  isMandatory: boolean;
  progress: number;
}

const LearnerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<LearnerStats>({
    totalFormations: 0,
    completedFormations: 0,
    inProgressFormations: 0,
    pendingFormations: 0,
    certificatesEarned: 0,
    totalTimeSpent: 0,
    averageScore: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // TODO: Appels API pour charger les données du dashboard apprenant
      // Simulation des données pour l'instant
      setStats({
        totalFormations: 12,
        completedFormations: 8,
        inProgressFormations: 3,
        pendingFormations: 1,
        certificatesEarned: 6,
        totalTimeSpent: 1440, // 24 heures
        averageScore: 85
      });

      setRecentActivities([
        {
          id: '1',
          type: 'formation_completed',
          title: 'Formation Sécurité Bancaire',
          description: 'Vous avez terminé cette formation avec succès',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 jours
          formationId: 'formation-1'
        },
        {
          id: '2',
          type: 'certificate_earned',
          title: 'Certificat Conformité RGPD',
          description: 'Félicitations ! Vous avez obtenu un nouveau certificat',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 jours
          formationId: 'formation-2'
        },
        {
          id: '3',
          type: 'formation_started',
          title: 'Formation Anti-Blanchiment',
          description: 'Vous avez commencé cette nouvelle formation',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours
          formationId: 'formation-3'
        }
      ]);

      setUpcomingDeadlines([
        {
          id: '1',
          formationTitle: 'Formation Obligatoire Sécurité',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
          isMandatory: true,
          progress: 60
        },
        {
          id: '2',
          formationTitle: 'Formation Conformité',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          isMandatory: false,
          progress: 0
        }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'formation_started':
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      case 'formation_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'certificate_earned':
        return <Award className="w-5 h-5 text-yellow-600" />;
      case 'quiz_passed':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'formation_started':
        return 'bg-blue-50 border-blue-200';
      case 'formation_completed':
        return 'bg-green-50 border-green-200';
      case 'certificate_earned':
        return 'bg-yellow-50 border-yellow-200';
      case 'quiz_passed':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Formations totales */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Formations</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalFormations}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Formations terminées */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Terminées</p>
              <p className="text-2xl font-bold text-green-900">{stats.completedFormations}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* En cours */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">En cours</p>
              <p className="text-2xl font-bold text-orange-900">{stats.inProgressFormations}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        {/* Certificats */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Certificats</p>
              <p className="text-2xl font-bold text-purple-900">{stats.certificatesEarned}</p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Statistiques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Temps total */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Temps total</p>
              <p className="text-xl font-bold text-gray-900">{formatTime(stats.totalTimeSpent)}</p>
            </div>
            <Clock className="w-6 h-6 text-gray-600" />
          </div>
        </div>

        {/* Score moyen */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Score moyen</p>
              <p className="text-xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
            <BarChart3 className="w-6 h-6 text-gray-600" />
          </div>
        </div>

        {/* Progression globale */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Progression</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((stats.completedFormations / stats.totalFormations) * 100)}%
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités récentes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="admin-title-md admin-title-spacing mb-4">Activités récentes</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
              >
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Échéances à venir */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="admin-title-md admin-title-spacing mb-4">Échéances à venir</h3>
          <div className="space-y-4">
            {upcomingDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  deadline.isMandatory 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{deadline.formationTitle}</p>
                    {deadline.isMandatory && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Échéance: {formatDate(deadline.dueDate)}</p>
                  {deadline.progress > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progression</span>
                        <span>{deadline.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${deadline.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="admin-title-md admin-title-spacing mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 font-medium">Continuer une formation</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-green-900 font-medium">Voir mes certificats</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-purple-900 font-medium">Suivre ma progression</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboardPage;
