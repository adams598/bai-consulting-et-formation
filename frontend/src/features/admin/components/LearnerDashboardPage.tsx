import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  BarChart3,
  Filter,
  UserCheck
} from 'lucide-react';
import '../styles/admin-typography.css';
import { authService } from '../../../services/authService';
import { progressApi, contentVisitApi, formationsApi, calendarApi } from '../../../api/learnerApi';
import { formationsApi as adminFormationsApi } from '../../../api/adminApi';

interface LearnerStats {
  totalFormations: number;
  completedFormations: number;
  inProgressFormations: number;
  pendingFormations: number;
  certificatesEarned: number;
  totalTimeSpent: number; // en minutes
  averageScore: number;
  globalProgress: number; // progression globale en %
}

interface RecentActivity {
  id: string;
  type: 'formation_assigned' | 'formation_started' | 'formation_completed' | 'certificate_earned' | 'formation_scheduled' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  formationId?: string;
  assignedBy?: { firstName: string; lastName: string };
  dueDate?: string;
  progressPercentage?: number;
  scheduledDate?: string;
  isRead?: boolean;
}

interface ScheduledEvent {
  id: string;
  formationTitle: string;
  eventType: 'formation' | 'lesson' | 'quiz';
  scheduledDate: string;
  dueDate?: string;
  isMandatory: boolean;
  progress: number;
  formationId: string;
}

type ActivityFilter = '24h' | '1week' | '1month' | '3months';
type ActivityType = 'all' | 'formation_assigned' | 'formation_started' | 'formation_completed' | 'formation_scheduled' | 'notification';

const LearnerDashboardPage: React.FC = () => {
  // Hook pour la navigation
  const navigate = useNavigate();
  
  // Variables globales pour les données de base
  const [myFormations, setMyFormations] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  
  const [stats, setStats] = useState<LearnerStats>({
    totalFormations: 0,
    completedFormations: 0,
    inProgressFormations: 0,
    pendingFormations: 0,
    certificatesEarned: 0,
    totalTimeSpent: 0,
    averageScore: 0,
    globalProgress: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('1week');
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityType>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadRecentActivities();
  }, [activityFilter, activityTypeFilter]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Utiliser la même API que AdminFormationsPage pour les COLLABORATOR
      const formationsResponse = await adminFormationsApi.getMyAssignedFormations();
      
      if (formationsResponse.data?.success && formationsResponse.data.data) {
        setMyFormations(formationsResponse.data.data);
        
        // Calculer les statistiques directement côté frontend
        calculateStats(formationsResponse.data.data);
      } else {
        setMyFormations([]);
        calculateStats([]);
      }

      // Charger les activités récentes
      await loadRecentActivities();

      // Charger les prochaines échéances depuis l'agenda
      try {
        const upcomingResponse = await calendarApi.getUpcomingDeadlines();
        if (upcomingResponse.success && upcomingResponse.data) {
          const upcomingEvents = upcomingResponse.data.map((event: any) => ({
            id: event.id,
            formationTitle: event.title,
            eventType: event.eventType || 'formation',
            scheduledDate: event.startDate,
            dueDate: event.endDate,
            isMandatory: event.type === 'FORMATION',
            progress: 0,
            formationId: event.formationId
          }));
          setScheduledEvents(upcomingEvents);
        } else {
          setScheduledEvents([]);
        }
      } catch (error) {
        console.warn('Aucune échéance trouvée');
        setScheduledEvents([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (formations: any[]) => {
    const totalFormations = formations.length;
    let completedFormations = 0;
    let inProgressFormations = 0;
    let pendingFormations = 0;
    let totalTimeSpent = 0;

    formations.forEach((assignment) => {
      const status = assignment.status;
      const progress = assignment.progress || 0;
      
      if (status === 'COMPLETED' || progress === 100) {
        completedFormations++;
        // Ajouter la durée de la formation terminée
        totalTimeSpent += assignment.formation?.duration || 0;
      } else if (status === 'IN_PROGRESS' || progress > 0) {
        inProgressFormations++;
      } else {
        pendingFormations++;
      }
    });

    // Pour l'instant, certificats et score moyen à 0 (à implémenter plus tard)
    const certificatesEarned = 0;
    const averageScore = 0;

    // Calculer la progression globale
    const globalProgress = totalFormations > 0 
      ? Math.round((completedFormations / totalFormations) * 100)
      : 0;

    const calculatedStats = {
      totalFormations,
      completedFormations,
      inProgressFormations,
      pendingFormations,
      certificatesEarned,
      totalTimeSpent,
      averageScore,
      globalProgress
    };

    setStats(calculatedStats);
  };

  const loadRecentActivities = async () => {
    try {
      const response = await contentVisitApi.getRecentActivities(activityFilter);
      
      if (response.success && response.data) {
        let filteredActivities = response.data;
        
        // Filtrer par type d'activité si nécessaire
        if (activityTypeFilter !== 'all') {
          filteredActivities = response.data.filter(activity => activity.type === activityTypeFilter);
        }
        
        setRecentActivities(filteredActivities);
      } else {
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      setRecentActivities([]);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilterLabel = (filter: ActivityFilter): string => {
    switch (filter) {
      case '24h': return 'Dernières 24h';
      case '1week': return 'Cette semaine';
      case '1month': return 'Ce mois';
      case '3months': return 'Trois derniers mois';
      default: return 'Cette semaine';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'formation_assigned':
        return <UserCheck className="w-5 h-5 text-orange-600" />;
      case 'formation_started':
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      case 'formation_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'certificate_earned':
        return <Award className="w-5 h-5 text-yellow-600" />;
      case 'formation_scheduled':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'formation_assigned':
        return 'bg-orange-50 border-orange-200';
      case 'formation_started':
        return 'bg-blue-50 border-blue-200';
      case 'formation_completed':
        return 'bg-green-50 border-green-200';
      case 'certificate_earned':
        return 'bg-yellow-50 border-yellow-200';
      case 'formation_scheduled':
        return 'bg-purple-50 border-purple-200';
      case 'notification':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleActivityClick = (activity: RecentActivity) => {
    if (activity.formationId) {
      // Naviguer vers la formation
      navigate(`/admin/formations`, { 
        state: { 
          selectedFormationId: activity.formationId,
          highlightActivity: activity.id
        } 
      });
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
                {stats.globalProgress}%
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités récentes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="admin-title-md admin-title-spacing">Activités récentes</h3>
            <div className="flex space-x-2">
              {/* Filtre par période */}
              <div className="relative">
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value as ActivityFilter)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
                >
                  <option value="24h">Dernières 24h</option>
                  <option value="1week">Cette semaine</option>
                  <option value="1month">Ce mois</option>
                  <option value="3months">3 derniers mois</option>
                </select>
                <Filter className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              
              {/* Filtre par type */}
              <div className="relative">
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value as ActivityType)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
                >
                  <option value="all">Tous les types</option>
                  <option value="formation_assigned">Formations assignées</option>
                  <option value="formation_started">Formations démarrées</option>
                  <option value="formation_completed">Formations terminées</option>
                  <option value="formation_scheduled">Formations planifiées</option>
                  <option value="notification">Notifications</option>
                </select>
                <Filter className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className={`space-y-4 ${recentActivities.length > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Aucune activité récente pour la période sélectionnée</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)} ${
                    activity.formationId ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                  }`}
                  onClick={() => handleActivityClick(activity)}
                >
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">
                      {activity.type === 'formation_assigned' && activity.assignedBy
                        ? `${activity.assignedBy.firstName} ${activity.assignedBy.lastName} vous a assigné une nouvelle formation`
                        : activity.type === 'formation_started' && activity.progressPercentage
                        ? `Progression: ${activity.progressPercentage}%`
                        : activity.type === 'formation_completed'
                        ? 'Formation terminée avec succès'
                        : activity.type === 'formation_scheduled' && activity.scheduledDate
                        ? `Planifié pour le ${new Date(activity.scheduledDate).toLocaleDateString('fr-FR')}`
                        : activity.description
                      }
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                      {activity.dueDate && activity.type === 'formation_assigned' && (
                        <span className="text-xs text-orange-600 font-medium">
                          Échéance: {formatDate(activity.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Échéances à venir */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="admin-title-md admin-title-spacing mb-4">Événements planifiés</h3>
          <div className={`space-y-4 ${scheduledEvents.length > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
            {scheduledEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Aucun événement planifié</p>
                <p className="text-xs mt-1">Planifiez vos formations depuis la page Formations</p>
              </div>
            ) : (
              scheduledEvents.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    event.isMandatory 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {event.formationTitle}
                        {event.eventType !== 'formation' && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({event.eventType === 'lesson' ? 'Leçon' : 'Quiz'})
                          </span>
                        )}
                      </p>
                      {event.isMandatory && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Obligatoire
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Planifié le: {formatDateTime(event.scheduledDate)}
                    </p>
                    {event.dueDate && (
                      <p className="text-xs text-gray-500">
                        À terminer avant le: {formatDate(event.dueDate)}
                      </p>
                    )}
                    {event.progress > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progression</span>
                          <span>{event.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${event.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
              ))
            )}
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
