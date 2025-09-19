import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Calendar,
  Award,
  BarChart3,
  User,
  Eye,
  AlertCircle
} from 'lucide-react';
import { User as UserType } from '../types';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/use-toast';
import { userProgressApi, UserProgressData } from '../../../api/userProgressApi';
import { contentVisitsApi, ContentVisit } from '../../../api/contentVisitsApi';

interface FormationProgress {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  timeSpent: number; // en minutes
  hasQuiz: boolean;
  quizPassed?: boolean;
  quizScore?: number;
  certificateEarned?: boolean;
}

interface ScheduledFormation {
  id: string;
  title: string;
  scheduledDate: string;
  isMandatory: boolean;
  status: 'upcoming' | 'overdue';
}

interface UserProgressModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
}

const UserProgressModal: React.FC<UserProgressModalProps> = ({ user, isOpen, onClose }) => {
  const [progressData, setProgressData] = useState<UserProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'formations' | 'quiz' | 'schedule' | 'visits'>('overview');
  const [recentVisits, setRecentVisits] = useState<ContentVisit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      loadUserProgress();
    }
  }, [isOpen, user]);

  const loadUserProgress = async () => {
    try {
      setIsLoading(true);
      
      const data = await userProgressApi.getUserProgress(user.id);
      setProgressData(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de progression",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentVisits = async () => {
    try {
      setVisitsLoading(true);
      const visits = await contentVisitsApi.getUserRecentVisits(user.id, 20);
      setRecentVisits(visits);
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les consultations récentes",
        variant: "destructive",
      });
    } finally {
      setVisitsLoading(false);
    }
  };

  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'in_progress':
        return 'En cours';
      case 'pending':
        return 'En attente';
      default:
        return 'Inconnu';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <span className="text-lg font-medium text-blue-700">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Suivi de progression - {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'formations', label: 'Formations', icon: BookOpen },
              { id: 'quiz', label: 'Quiz', icon: Award },
              { id: 'schedule', label: 'Planification', icon: Calendar },
              { id: 'visits', label: 'Consultations', icon: Eye }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : progressData ? (
            <>
              {/* Vue d'ensemble */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Statistiques principales */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Formations</p>
                          <p className="text-2xl font-bold text-blue-900">{progressData.totalFormations}</p>
                        </div>
                        <BookOpen className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Terminées</p>
                          <p className="text-2xl font-bold text-green-900">{progressData.completedFormations}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 text-sm font-medium">En cours</p>
                          <p className="text-2xl font-bold text-orange-900">{progressData.inProgressFormations}</p>
                        </div>
                        <Clock className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium">Score moyen</p>
                          <p className="text-2xl font-bold text-purple-900">{progressData.averageQuizScore}%</p>
                        </div>
                        <Award className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  {/* Activité récente */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Activité récente</h3>
                    <div className="space-y-3">
                      {progressData.lastActivity && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Dernière activité: {formatDate(progressData.lastActivity)}</span>
                        </div>
                      )}
                      {progressData.lastFormationViewed && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Eye className="w-4 h-4 mr-2" />
                          <span>Dernière formation vue: {progressData.lastFormationViewed}</span>
                          {progressData.lastFormationViewedDate && (
                            <span className="ml-2 text-gray-500">
                              ({formatDate(progressData.lastFormationViewedDate)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Formations */}
              {activeTab === 'formations' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Progression des formations</h3>
                  <div className="space-y-4">
                    {progressData.formations.map((formation) => (
                      <div key={formation.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-base font-medium text-gray-800">{formation.title}</h4>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>Temps passé: {formatDuration(formation.timeSpent)}</span>
                              {formation.startedAt && (
                                <span>Démarrée: {formatDate(formation.startedAt)}</span>
                              )}
                              {formation.completedAt && (
                                <span>Terminée: {formatDate(formation.completedAt)}</span>
                              )}
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(formation.status)}`}>
                            {getStatusText(formation.status)}
                          </span>
                        </div>
                        
                        {/* Barre de progression */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Progression</span>
                            <span>{formation.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${formation.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Informations supplémentaires */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {formation.hasQuiz && (
                            <div className="flex items-center">
                              <Award className="w-4 h-4 mr-1" />
                              <span>Quiz: {formation.quizPassed ? 'Réussi' : 'En attente'}</span>
                              {formation.quizScore && (
                                <span className="ml-1">({formation.quizScore}%)</span>
                              )}
                            </div>
                          )}
                          {formation.certificateEarned && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span>Certificat obtenu</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz */}
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Statistiques des quiz</h3>
                  
                  {/* Statistiques des quiz */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">Total tentatives</p>
                          <p className="text-xl font-bold text-gray-900">{progressData.totalQuizAttempts}</p>
                        </div>
                        <BarChart3 className="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Réussis</p>
                          <p className="text-xl font-bold text-green-900">{progressData.passedQuizAttempts}</p>
                        </div>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-600 text-sm font-medium">Ratés</p>
                          <p className="text-xl font-bold text-red-900">{progressData.failedQuizAttempts}</p>
                        </div>
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Taux de réussite */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-base font-medium text-gray-800 mb-4">Taux de réussite</h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Score moyen</span>
                          <span>{progressData.averageQuizScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full"
                            style={{ width: `${progressData.averageQuizScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Planification */}
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Formations planifiées</h3>
                  <div className="space-y-4">
                    {progressData.scheduledFormations.map((formation) => (
                      <div key={formation.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-base font-medium text-gray-800">{formation.title}</h4>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>Date prévue: {formatDate(formation.scheduledDate)}</span>
                              {formation.isMandatory && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Obligatoire
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            formation.status === 'upcoming' 
                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {formation.status === 'upcoming' ? 'À venir' : 'En retard'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consultations */}
              {activeTab === 'visits' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Consultations récentes</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadRecentVisits}
                      disabled={visitsLoading}
                      className="text-sm"
                    >
                      {visitsLoading ? 'Chargement...' : 'Actualiser'}
                    </Button>
                  </div>
                  
                  {visitsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : recentVisits.length > 0 ? (
                    <div className="space-y-3">
                      {recentVisits.map((visit) => (
                        <div key={visit.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  visit.contentType === 'formation_detail' ? 'bg-blue-100 text-blue-800' :
                                  visit.contentType === 'lesson_detail' ? 'bg-green-100 text-green-800' :
                                  visit.contentType === 'quiz_detail' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {visit.contentType === 'formation_detail' ? 'Formation' :
                                   visit.contentType === 'lesson_detail' ? 'Leçon' :
                                   visit.contentType === 'quiz_detail' ? 'Quiz' :
                                   visit.contentType}
                                </span>
                                {visit.durationFormatted && (
                                  <span className="text-xs text-gray-500">
                                    {visit.durationFormatted}
                                  </span>
                                )}
                              </div>
                              
                              <h4 className="text-base font-medium text-gray-800 mb-1">
                                {visit.contentInfo?.title || visit.contentTitle || 'Contenu consulté'}
                              </h4>
                              
                              {visit.contentInfo?.formationTitle && (
                                <p className="text-sm text-gray-600 mb-2">
                                  Formation: {visit.contentInfo.formationTitle}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{formatDate(visit.visitedAt)}</span>
                                {visit.url && (
                                  <span className="truncate max-w-xs">
                                    {visit.url}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune consultation récente</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Impossible de charger les données de progression</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProgressModal;
