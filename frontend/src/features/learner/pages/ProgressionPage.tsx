import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  BookOpen, 
  Target, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { LearnerLayout, ProgressBar, StatsCard, FormationCard } from '../components';
import { 
  LearnerFormationAssignment, 
  LearnerProgress, 
  LearnerStats,
  FormationStatus,
  ContentVisit 
} from '../types';
import { formationsApi, progressApi, contentVisitApi } from '../../../api/learnerApi';
import { useToast } from '../../../components/ui/use-toast';

interface ProgressData {
  date: string;
  progress: number;
  timeSpent: number;
}

const ProgressionPage: React.FC = () => {
  const [formations, setFormations] = useState<LearnerFormationAssignment[]>([]);
  const [stats, setStats] = useState<LearnerStats | null>(null);
  const [progressHistory, setProgressHistory] = useState<ProgressData[]>([]);
  const [contentVisits, setContentVisits] = useState<ContentVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'formations' | 'analytics'>('overview');

  const { toast } = useToast();

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      const [formationsResponse, statsResponse, visitsResponse] = await Promise.all([
        formationsApi.getMyFormations(),
        progressApi.getStats(),
        contentVisitApi.getVisitHistory()
      ]);
      
      setFormations(formationsResponse.data);
      setStats(statsResponse.data);
      setContentVisits(visitsResponse.data);
      
      // Générer l'historique de progression basé sur les vraies visites
      setProgressHistory(generateProgressHistoryFromVisits(visitsResponse.data));
      
    } catch (error) {
      console.error('Erreur lors du chargement des données de progression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données de progression",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateProgressHistoryFromVisits = (visits: ContentVisit[]): ProgressData[] => {
    const data: ProgressData[] = [];
    const today = new Date();
    
    // Créer un mapping des 30 derniers jours
    const last30Days = new Map<string, { totalTime: number; completedCount: number; totalVisits: number }>();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      last30Days.set(dateKey, { totalTime: 0, completedCount: 0, totalVisits: 0 });
    }
    
    // Agréger les données des visites par jour
    visits.forEach(visit => {
      const visitDate = new Date(visit.visitedAt).toISOString().split('T')[0];
      const dayData = last30Days.get(visitDate);
      
      if (dayData) {
        dayData.totalTime += Math.floor(visit.timeSpent / 60); // Convertir en minutes
        dayData.totalVisits += 1;
        if (visit.completed) {
          dayData.completedCount += 1;
        }
      }
    });
    
    // Convertir en format ProgressData
    Array.from(last30Days.entries()).forEach(([date, dayData]) => {
      const progressPercent = dayData.totalVisits > 0 
        ? Math.round((dayData.completedCount / dayData.totalVisits) * 100)
        : 0;
        
      data.push({
        date,
        progress: progressPercent,
        timeSpent: dayData.totalTime
      });
    });
    
    return data;
  };

  const getFormationsByStatus = () => {
    return {
      notStarted: formations.filter(f => f.status === FormationStatus.NOT_STARTED),
      inProgress: formations.filter(f => f.status === FormationStatus.IN_PROGRESS),
      completed: formations.filter(f => f.status === FormationStatus.COMPLETED),
      overdue: formations.filter(f => f.status === FormationStatus.OVERDUE)
    };
  };

  const getWeeklyProgress = () => {
    const lastWeek = progressHistory.slice(-7);
    const totalTime = lastWeek.reduce((sum, day) => sum + day.timeSpent, 0);
    const avgProgress = lastWeek.length > 0 
      ? lastWeek.reduce((sum, day) => sum + day.progress, 0) / lastWeek.length
      : 0;
    
    return {
      totalTime,
      avgProgress,
      dailyAverage: totalTime / Math.max(1, lastWeek.length)
    };
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const renderOverview = () => {
    const formationsByStatus = getFormationsByStatus();
    const weeklyProgress = getWeeklyProgress();

    return (
      <div className="space-y-6">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Progression globale"
            value={`${Math.round(stats?.averageProgress || 0)}%`}
            icon={TrendingUp}
            color="blue"
            subtitle="Moyenne de toutes vos formations"
          />
          <StatsCard
            title="Temps cette semaine"
            value={formatTime(weeklyProgress.totalTime)}
            icon={Clock}
            color="purple"
            subtitle={`Moyenne: ${formatTime(weeklyProgress.dailyAverage)}/jour`}
          />
          <StatsCard
            title="Formations en cours"
            value={formationsByStatus.inProgress.length}
            icon={BookOpen}
            color="yellow"
            subtitle={`${formationsByStatus.completed.length} terminées`}
          />
          <StatsCard
            title="Certificats obtenus"
            value={stats?.certificatesEarned || 0}
            icon={Award}
            color="green"
            subtitle="Validations réussies"
          />
        </div>

        {/* Graphique de progression */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Progression des 30 derniers jours
            </h3>
          </div>
          
          <div className="h-64 flex items-end space-x-1">
            {progressHistory.map((day, index) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-200 hover:bg-blue-600"
                  style={{ height: `${(day.progress / 100) * 200}px` }}
                />
                
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 p-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap transition-opacity">
                  <div>{new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                  <div>Progression: {Math.round(day.progress)}%</div>
                  <div>Temps: {formatTime(day.timeSpent)}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Il y a 30 jours</span>
            <span>Aujourd'hui</span>
          </div>
        </div>

        {/* Répartition par statut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Répartition des formations
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Terminées</span>
                </div>
                <span className="text-sm font-medium">{formationsByStatus.completed.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">En cours</span>
                </div>
                <span className="text-sm font-medium">{formationsByStatus.inProgress.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Non commencées</span>
                </div>
                <span className="text-sm font-medium">{formationsByStatus.notStarted.length}</span>
              </div>
              
              {formationsByStatus.overdue.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">En retard</span>
                  </div>
                  <span className="text-sm font-medium">{formationsByStatus.overdue.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Objectifs et recommandations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Recommandations
            </h3>
            
            <div className="space-y-3">
              {formationsByStatus.overdue.length > 0 && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Formations en retard</p>
                    <p className="text-xs text-red-600">
                      Vous avez {formationsByStatus.overdue.length} formation(s) en retard. 
                      Rattrapez-vous rapidement !
                    </p>
                  </div>
                </div>
              )}
              
              {weeklyProgress.dailyAverage < 30 && (
                <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Augmentez votre rythme</p>
                    <p className="text-xs text-yellow-600">
                      Essayez de consacrer au moins 30min par jour à vos formations.
                    </p>
                  </div>
                </div>
              )}
              
              {formationsByStatus.inProgress.length > 0 && (
                <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Continuez sur votre lancée</p>
                    <p className="text-xs text-blue-600">
                      Vous avez {formationsByStatus.inProgress.length} formation(s) en cours. 
                      Excellent progrès !
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFormationsProgress = () => {
    return (
      <div className="space-y-6">
        {formations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {formations.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {assignment.formation.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {assignment.formation.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(assignment.formation.duration)}
                      </span>
                      {assignment.dueDate && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Échéance: {new Date(assignment.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.status === FormationStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                        assignment.status === FormationStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                        assignment.status === FormationStatus.OVERDUE ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status === FormationStatus.NOT_STARTED ? 'Non commencée' :
                         assignment.status === FormationStatus.IN_PROGRESS ? 'En cours' :
                         assignment.status === FormationStatus.COMPLETED ? 'Terminée' :
                         'En retard'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barre de progression détaillée */}
                <div className="space-y-2">
                  <ProgressBar
                    progress={assignment.progress?.progress || 0}
                    status={
                      assignment.status === FormationStatus.COMPLETED ? 'completed' :
                      assignment.status === FormationStatus.IN_PROGRESS ? 'in_progress' :
                      assignment.status === FormationStatus.OVERDUE ? 'overdue' :
                      'not_started'
                    }
                    showLabel={true}
                    showIcon={true}
                  />
                  
                  {assignment.progress && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        Démarré le: {assignment.progress.startedAt ? 
                          new Date(assignment.progress.startedAt).toLocaleDateString('fr-FR') : 
                          'Non démarré'
                        }
                      </span>
                      <span>
                        Temps passé: {formatTime(assignment.progress.timeSpent)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation</h3>
            <p className="text-gray-600">Vous n'avez pas encore de formations assignées.</p>
          </div>
        )}
      </div>
    );
  };

  const renderAnalytics = () => {
    const weeklyProgress = getWeeklyProgress();
    
    return (
      <div className="space-y-6">
        {/* Métriques hebdomadaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(weeklyProgress.totalTime)}
              </p>
              <p className="text-sm font-medium text-gray-600">Cette semaine</p>
              <p className="text-xs text-gray-500">
                {formatTime(weeklyProgress.dailyAverage)} par jour en moyenne
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(weeklyProgress.avgProgress)}%
              </p>
              <p className="text-sm font-medium text-gray-600">Progression moyenne</p>
              <p className="text-xs text-gray-500">Cette semaine</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((stats?.completedFormations || 0) / (stats?.totalFormations || 1) * 100)}%
              </p>
              <p className="text-sm font-medium text-gray-600">Taux de réussite</p>
              <p className="text-xs text-gray-500">Formations terminées</p>
            </div>
          </div>
        </div>

        {/* Historique détaillé */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Historique d'activité</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {progressHistory.slice(-10).reverse().map((day, index) => (
                <div key={day.date} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">
                      {new Date(day.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span>Progression: {Math.round(day.progress)}%</span>
                    <span>Temps: {formatTime(day.timeSpent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <LearnerLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ma progression</h1>
          <p className="text-gray-600 mt-1">
            Suivez vos progrès et analysez vos performances d'apprentissage
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('formations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'formations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Par formation
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analyses
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'formations' && renderFormationsProgress()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </LearnerLayout>
  );
};

export default ProgressionPage;
