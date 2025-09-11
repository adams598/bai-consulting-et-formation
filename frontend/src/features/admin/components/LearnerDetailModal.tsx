import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  BookOpen, 
  Clock, 
  Award, 
  BarChart3, 
  Calendar,
  Download,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye
} from 'lucide-react';
import { User as UserType, Formation, UserProgress } from '../types';

interface LearnerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner: UserType;
}

interface LearnerStats {
  totalFormations: number;
  completedFormations: number;
  inProgressFormations: number;
  pendingFormations: number;
  averageScore: number;
  totalTimeSpent: number; // en minutes
  lastActivity: Date;
  completionRate: number;
}

interface FormationProgress {
  formation: Formation;
  progress: number; // 0-100
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  timeSpent: number; // en minutes
  lastAccessed: Date;
  quizScore?: number;
  dueDate?: Date;
  isMandatory: boolean;
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  formationTitle?: string;
  score?: number;
}

const LearnerDetailModal: React.FC<LearnerDetailModalProps> = ({
  isOpen,
  onClose,
  learner
}) => {
  const [stats, setStats] = useState<LearnerStats | null>(null);
  const [formationProgress, setFormationProgress] = useState<FormationProgress[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'formations' | 'activity' | 'communications'>('overview');

  useEffect(() => {
    if (isOpen) {
      loadLearnerData();
    }
  }, [isOpen, learner.id]);

  const loadLearnerData = async () => {
    try {
      setIsLoading(true);
      // TODO: Appels API réels
      // const [statsResponse, progressResponse, activityResponse] = await Promise.all([
      //   learnerApi.getStats(learner.id),
      //   learnerApi.getFormationProgress(learner.id),
      //   learnerApi.getActivityLog(learner.id)
      // ]);
      
      // Données de test pour le moment
      setStats({
        totalFormations: 8,
        completedFormations: 5,
        inProgressFormations: 2,
        pendingFormations: 1,
        averageScore: 87.5,
        totalTimeSpent: 1240, // 20h 40min
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
        completionRate: 62.5
      });

      setFormationProgress([
        {
          formation: {
            id: '1',
            title: 'Compliance Bancaire',
            description: 'Formation sur la conformité',
            duration: 120,
            isActive: true,
            hasQuiz: true,
            quizRequired: true,
            createdBy: 'admin',
            createdAt: '2024-01-15',
            updatedAt: '2024-01-15'
          },
          progress: 100,
          status: 'completed',
          timeSpent: 135,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          quizScore: 92,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isMandatory: true
        },
        {
          formation: {
            id: '2',
            title: 'Gestion des Risques',
            description: 'Formation sur la gestion des risques',
            duration: 90,
            isActive: true,
            hasQuiz: true,
            quizRequired: true,
            createdBy: 'admin',
            createdAt: '2024-01-10',
            updatedAt: '2024-01-10'
          },
          progress: 65,
          status: 'in_progress',
          timeSpent: 58,
          lastAccessed: new Date(Date.now() - 3 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          isMandatory: true
        },
        {
          formation: {
            id: '3',
            title: 'Produits Bancaires',
            description: 'Formation sur les produits',
            duration: 60,
            isActive: true,
            hasQuiz: false,
            quizRequired: false,
            createdBy: 'admin',
            createdAt: '2024-01-20',
            updatedAt: '2024-01-20'
          },
          progress: 0,
          status: 'overdue',
          timeSpent: 0,
          lastAccessed: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isMandatory: true
        }
      ]);

      setActivityLog([
        {
          id: '1',
          type: 'formation_completed',
          description: 'Formation "Compliance Bancaire" terminée avec succès',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          formationTitle: 'Compliance Bancaire',
          score: 92
        },
        {
          id: '2',
          type: 'quiz_completed',
          description: 'Quiz "Compliance Bancaire" réussi',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          formationTitle: 'Compliance Bancaire',
          score: 92
        },
        {
          id: '3',
          type: 'formation_started',
          description: 'Formation "Gestion des Risques" démarrée',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          formationTitle: 'Gestion des Risques'
        }
      ]);

    } catch (error) {
      console.error('Erreur lors du chargement des données de l\'apprenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'in_progress':
        return 'En cours';
      case 'overdue':
        return 'En retard';
      default:
        return 'Non démarrée';
    }
  };

  const exportLearnerData = () => {
    // TODO: Implémenter l'export des données
    console.log('Export des données pour:', learner.firstName, learner.lastName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              {learner.avatar ? (
                <img
                  src={learner.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {learner.firstName} {learner.lastName}
              </h2>
              <p className="text-gray-600">{learner.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportLearnerData}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'formations', label: 'Formations', icon: BookOpen },
              { id: 'activity', label: 'Activité', icon: Clock },
              { id: 'communications', label: 'Communications', icon: Mail }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Vue d'ensemble */}
              {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                  {/* Informations personnelles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Informations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{learner.email}</span>
                        </div>
                        {learner.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{learner.phone}</span>
                          </div>
                        )}
                        {learner.department && (
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span>{learner.department}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Dernière activité: {stats.lastActivity.toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Statistiques de formation */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Taux de réussite</span>
                          <span className="text-sm font-medium">{stats.completionRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Score moyen</span>
                          <span className="text-sm font-medium">{stats.averageScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Temps total</span>
                          <span className="text-sm font-medium">{formatDuration(stats.totalTimeSpent)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-900">{stats.totalFormations}</div>
                      <div className="text-sm text-blue-700">Formations assignées</div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900">{stats.completedFormations}</div>
                      <div className="text-sm text-green-700">Terminées</div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-yellow-900">{stats.inProgressFormations}</div>
                      <div className="text-sm text-yellow-700">En cours</div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-900">{stats.pendingFormations}</div>
                      <div className="text-sm text-red-700">En retard</div>
                    </div>
                  </div>

                  {/* Graphique de progression */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Progression Globale</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Formations terminées</span>
                        <span className="text-sm font-medium">{stats.completedFormations}/{stats.totalFormations}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${stats.completionRate}%` }}
                        ></div>
                      </div>
                      <div className="text-center">
                        <span className="text-2xl font-bold text-gray-900">{stats.completionRate}%</span>
                        <p className="text-sm text-gray-600">de progression globale</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formations */}
              {activeTab === 'formations' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Formations assignées</h4>
                    <div className="text-sm text-gray-600">
                      {formationProgress.length} formation(s)
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {formationProgress.map((progress) => (
                      <div key={progress.formation.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{progress.formation.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{progress.formation.description}</p>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            {getStatusIcon(progress.status)}
                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(progress.status)}`}>
                              {getStatusLabel(progress.status)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Barre de progression */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Progression</span>
                              <span className="font-medium">{progress.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  progress.status === 'completed' ? 'bg-green-500' :
                                  progress.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progress.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Statistiques */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Temps passé:</span>
                              <div className="font-medium">{formatDuration(progress.timeSpent)}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Durée estimée:</span>
                              <div className="font-medium">{formatDuration(progress.formation.duration)}</div>
                            </div>
                            {progress.quizScore && (
                              <div>
                                <span className="text-gray-500">Score quiz:</span>
                                <div className="font-medium text-green-600">{progress.quizScore}%</div>
                              </div>
                            )}
                            {progress.dueDate && (
                              <div>
                                <span className="text-gray-500">Date limite:</span>
                                <div className={`font-medium ${
                                  progress.status === 'overdue' ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {progress.dueDate.toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activité */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Historique d'activité</h4>
                  
                  <div className="space-y-3">
                    {activityLog.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-white rounded-full">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-xs text-gray-500">
                              {activity.timestamp.toLocaleDateString('fr-FR')} à {activity.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {activity.score && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Score: {activity.score}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Communications */}
              {activeTab === 'communications' && (
                <div className="space-y-4">
                  <div className="text-center py-12">
                    <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900">Communications</h4>
                    <p className="text-gray-600 mt-2">
                      Fonctionnalité à venir : historique des messages et notifications
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Fonctions utilitaires
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'formation_completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'formation_started':
      return <BookOpen className="w-4 h-4 text-blue-600" />;
    case 'quiz_completed':
      return <Award className="w-4 h-4 text-purple-600" />;
    case 'quiz_failed':
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-600" />;
  }
};

export default LearnerDetailModal;

