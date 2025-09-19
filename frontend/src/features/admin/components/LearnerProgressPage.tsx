import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  BookOpen,
  Award,
  Calendar,
  BarChart3,
  Target,
  Zap,
  AlertCircle
} from 'lucide-react';
import '../styles/admin-typography.css';
import { authService } from '../../../services/authService';

interface FormationProgress {
  id: string;
  formationTitle: string;
  formationCode?: string;
  totalDuration: number; // en minutes
  timeSpent: number; // en minutes
  progress: number; // pourcentage
  status: 'pending' | 'in_progress' | 'completed';
  lastAccessed?: Date;
  dueDate?: Date;
  isMandatory: boolean;
  hasQuiz: boolean;
  quizPassed?: boolean;
  certificateEarned?: boolean;
  lessons: LessonProgress[];
}

interface LessonProgress {
  id: string;
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'PRESENTATION' | 'QUIZ';
  duration: number; // en minutes
  timeSpent: number; // en minutes
  progress: number; // pourcentage
  isCompleted: boolean;
  lastAccessed?: Date;
}

interface OverallStats {
  totalFormations: number;
  completedFormations: number;
  inProgressFormations: number;
  totalTimeSpent: number; // en minutes
  averageProgress: number;
  certificatesEarned: number;
  quizPassRate: number;
  streakDays: number; // jours consécutifs d'activité
}

const LearnerProgressPage: React.FC = () => {
  const [formationsProgress, setFormationsProgress] = useState<FormationProgress[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalFormations: 0,
    completedFormations: 0,
    inProgressFormations: 0,
    totalTimeSpent: 0,
    averageProgress: 0,
    certificatesEarned: 0,
    quizPassRate: 0,
    streakDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      // TODO: Appel API pour charger les données de progression
      // Simulation des données pour l'instant
      const mockFormationsProgress: FormationProgress[] = [
        {
          id: '1',
          formationTitle: 'Sécurité Bancaire',
          formationCode: 'SEC001',
          totalDuration: 120,
          timeSpent: 125,
          progress: 100,
          status: 'completed',
          lastAccessed: new Date('2024-01-20'),
          dueDate: new Date('2024-02-15'),
          isMandatory: true,
          hasQuiz: true,
          quizPassed: true,
          certificateEarned: true,
          lessons: [
            {
              id: 'l1',
              title: 'Introduction à la sécurité bancaire',
              type: 'VIDEO',
              duration: 30,
              timeSpent: 32,
              progress: 100,
              isCompleted: true,
              lastAccessed: new Date('2024-01-18')
            },
            {
              id: 'l2',
              title: 'Procédures de sécurité',
              type: 'DOCUMENT',
              duration: 45,
              timeSpent: 48,
              progress: 100,
              isCompleted: true,
              lastAccessed: new Date('2024-01-19')
            },
            {
              id: 'l3',
              title: 'Quiz de validation',
              type: 'QUIZ',
              duration: 15,
              timeSpent: 12,
              progress: 100,
              isCompleted: true,
              lastAccessed: new Date('2024-01-20')
            }
          ]
        },
        {
          id: '2',
          formationTitle: 'Conformité RGPD',
          formationCode: 'RGPD001',
          totalDuration: 90,
          timeSpent: 58,
          progress: 65,
          status: 'in_progress',
          lastAccessed: new Date('2024-01-25'),
          dueDate: new Date('2024-03-20'),
          isMandatory: true,
          hasQuiz: true,
          quizPassed: false,
          lessons: [
            {
              id: 'l4',
              title: 'Principes du RGPD',
              type: 'VIDEO',
              duration: 25,
              timeSpent: 25,
              progress: 100,
              isCompleted: true,
              lastAccessed: new Date('2024-01-22')
            },
            {
              id: 'l5',
              title: 'Droits des personnes',
              type: 'PRESENTATION',
              duration: 35,
              timeSpent: 20,
              progress: 57,
              isCompleted: false,
              lastAccessed: new Date('2024-01-25')
            },
            {
              id: 'l6',
              title: 'Quiz de validation',
              type: 'QUIZ',
              duration: 15,
              timeSpent: 0,
              progress: 0,
              isCompleted: false
            }
          ]
        },
        {
          id: '3',
          formationTitle: 'Anti-Blanchiment',
          formationCode: 'ABL001',
          totalDuration: 150,
          timeSpent: 0,
          progress: 0,
          status: 'pending',
          dueDate: new Date('2024-04-25'),
          isMandatory: false,
          hasQuiz: true,
          lessons: [
            {
              id: 'l7',
              title: 'Introduction au blanchiment',
              type: 'VIDEO',
              duration: 40,
              timeSpent: 0,
              progress: 0,
              isCompleted: false
            },
            {
              id: 'l8',
              title: 'Techniques de détection',
              type: 'DOCUMENT',
              duration: 60,
              timeSpent: 0,
              progress: 0,
              isCompleted: false
            },
            {
              id: 'l9',
              title: 'Quiz de validation',
              type: 'QUIZ',
              duration: 20,
              timeSpent: 0,
              progress: 0,
              isCompleted: false
            }
          ]
        }
      ];

      setFormationsProgress(mockFormationsProgress);

      // Calculer les statistiques globales
      const completed = mockFormationsProgress.filter(f => f.status === 'completed').length;
      const inProgress = mockFormationsProgress.filter(f => f.status === 'in_progress').length;
      const totalTime = mockFormationsProgress.reduce((sum, f) => sum + f.timeSpent, 0);
      const avgProgress = mockFormationsProgress.length > 0 
        ? mockFormationsProgress.reduce((sum, f) => sum + f.progress, 0) / mockFormationsProgress.length 
        : 0;
      const certificates = mockFormationsProgress.filter(f => f.certificateEarned).length;
      const quizPassed = mockFormationsProgress.filter(f => f.quizPassed).length;
      const totalQuizzes = mockFormationsProgress.filter(f => f.hasQuiz && f.status === 'completed').length;
      const quizPassRate = totalQuizzes > 0 ? (quizPassed / totalQuizzes) * 100 : 0;

      setOverallStats({
        totalFormations: mockFormationsProgress.length,
        completedFormations: completed,
        inProgressFormations: inProgress,
        totalTimeSpent: totalTime,
        averageProgress: Math.round(avgProgress),
        certificatesEarned: certificates,
        quizPassRate: Math.round(quizPassRate),
        streakDays: 7 // Simulation
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données de progression:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return '🎥';
      case 'DOCUMENT':
        return '📄';
      case 'PRESENTATION':
        return '📊';
      case 'QUIZ':
        return '❓';
      default:
        return '📚';
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Progression moyenne */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Progression moyenne</p>
              <p className="text-2xl font-bold text-blue-900">{overallStats.averageProgress}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Temps total */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Temps total</p>
              <p className="text-2xl font-bold text-green-900">{formatDuration(overallStats.totalTimeSpent)}</p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Certificats */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Certificats</p>
              <p className="text-2xl font-bold text-purple-900">{overallStats.certificatesEarned}</p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        {/* Série */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Série</p>
              <p className="text-2xl font-bold text-orange-900">{overallStats.streakDays} jours</p>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Statistiques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formations terminées */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Formations terminées</p>
              <p className="text-xl font-bold text-gray-900">
                {overallStats.completedFormations} / {overallStats.totalFormations}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* Taux de réussite quiz */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Réussite quiz</p>
              <p className="text-xl font-bold text-gray-900">{overallStats.quizPassRate}%</p>
            </div>
            <Target className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Formations en cours */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">En cours</p>
              <p className="text-xl font-bold text-gray-900">{overallStats.inProgressFormations}</p>
            </div>
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Détail des formations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="admin-title-md admin-title-spacing mb-6">Détail des formations</h3>
        
        <div className="space-y-6">
          {formationsProgress.map((formation) => (
            <div key={formation.id} className="border border-gray-200 rounded-lg p-6">
              {/* En-tête de la formation */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{formation.formationTitle}</h4>
                    {formation.formationCode && (
                      <span className="text-sm text-gray-600">({formation.formationCode})</span>
                    )}
                    {formation.isMandatory && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Durée totale: {formatDuration(formation.totalDuration)}</span>
                    <span>Temps passé: {formatDuration(formation.timeSpent)}</span>
                    {formation.dueDate && (
                      <span>Échéance: {formatDate(formation.dueDate)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(formation.status)}`}>
                    {getStatusText(formation.status)}
                  </span>
                  {formation.certificateEarned && (
                    <Award className="w-5 h-5 text-yellow-600" title="Certificat obtenu" />
                  )}
                </div>
              </div>

              {/* Barre de progression globale */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progression globale</span>
                  <span>{formation.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${formation.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Détail des leçons */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Leçons</h5>
                {formation.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getLessonIcon(lesson.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{lesson.title}</p>
                        <p className="text-xs text-gray-600">
                          {formatDuration(lesson.duration)} • {lesson.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {formatDuration(lesson.timeSpent)} / {formatDuration(lesson.duration)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lesson.progress}% complété
                        </div>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            lesson.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${lesson.progress}%` }}
                        ></div>
                      </div>
                      {lesson.isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {formation.lastAccessed && (
                    <span>Dernière visite: {formatDate(formation.lastAccessed)}</span>
                  )}
                  {formation.hasQuiz && (
                    <span className={`flex items-center ${
                      formation.quizPassed ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Quiz {formation.quizPassed ? 'réussi' : 'en attente'}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {formation.status === 'pending' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Commencer
                    </button>
                  )}
                  {formation.status === 'in_progress' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                      Continuer
                    </button>
                  )}
                  {formation.status === 'completed' && (
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                      Revoir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearnerProgressPage;
