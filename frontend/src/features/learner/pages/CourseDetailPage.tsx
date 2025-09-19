import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Award, 
  Users,
  Calendar,
  Target,
  FileText,
  Video,
  Presentation,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { LearnerLayout, ProgressBar } from '../components';
import LessonViewer from '../components/LessonViewer';
import { 
  LearnerFormationAssignment, 
  LearnerLesson, 
  LearnerQuiz,
  FormationStatus,
  LessonType 
} from '../types';
import { formationsApi, quizApi } from '../../../api/learnerApi';
import { useToast } from '../../../components/ui/use-toast';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assignment, setAssignment] = useState<LearnerFormationAssignment | null>(null);
  const [lessons, setLessons] = useState<LearnerLesson[]>([]);
  const [quiz, setQuiz] = useState<LearnerQuiz | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LearnerLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingFormation, setStartingFormation] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      loadCourseData();
    }
  }, [id]);

  const loadCourseData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      const [formationResponse, contentResponse] = await Promise.all([
        formationsApi.getFormationById(id),
        formationsApi.getFormationContent(id)
      ]);

      setAssignment(formationResponse.data);
      setLessons(contentResponse.data);

      // Charger le quiz si la formation en a un
      if (formationResponse.data.formation.hasQuiz) {
        try {
          // Rechercher le quiz associé à cette formation
          // En supposant qu'il y a une relation ou un endpoint pour récupérer le quiz par formation
          const quizResponse = await quizApi.getQuizById(formationResponse.data.formation.id);
          setQuiz(quizResponse.data);
        } catch (error) {
          console.error('Erreur lors du chargement du quiz:', error);
          // Le quiz pourrait ne pas exister encore, ce n'est pas bloquant
        }
      }

      // Ouvrir automatiquement toutes les sections
      const sections = contentResponse.data
        .filter(item => item.contentType === 'SECTION')
        .map(section => section.id);
      setExpandedSections(new Set(sections));

    } catch (error) {
      console.error('Erreur lors du chargement de la formation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la formation",
        variant: "destructive"
      });
      navigate('/apprenant/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleStartFormation = async () => {
    if (!id || !assignment) return;

    try {
      setStartingFormation(true);
      await formationsApi.startFormation(id);
      
      // Mettre à jour le statut local
      setAssignment(prev => prev ? {
        ...prev,
        status: FormationStatus.IN_PROGRESS
      } : null);

      toast({
        title: "Formation démarrée",
        description: "Vous pouvez maintenant accéder au contenu de la formation",
      });

      // Ouvrir la première leçon
      const firstLesson = lessons.find(lesson => lesson.contentType === 'LESSON');
      if (firstLesson) {
        setCurrentLesson(firstLesson);
      }

    } catch (error) {
      console.error('Erreur lors du démarrage de la formation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la formation",
        variant: "destructive"
      });
    } finally {
      setStartingFormation(false);
    }
  };

  const handleLessonComplete = (lessonId: string, timeSpent: number) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
    
    toast({
      title: "Leçon terminée !",
      description: `Temps passé: ${Math.floor(timeSpent / 60)}min ${timeSpent % 60}s`,
    });

    // Passer automatiquement à la leçon suivante
    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    const nextLesson = lessons.find((l, index) => 
      index > currentIndex && l.contentType === 'LESSON'
    );
    
    if (nextLesson) {
      setTimeout(() => {
        setCurrentLesson(nextLesson);
      }, 2000);
    }
  };

  const handleLessonProgress = (lessonId: string, progress: number, timeSpent: number) => {
    // Mettre à jour la progression de la leçon
    console.log(`Leçon ${lessonId}: ${progress}% - ${timeSpent}s`);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getLessonIcon = (type: LessonType) => {
    switch (type) {
      case LessonType.VIDEO:
        return <Video className="h-5 w-5 text-green-600" />;
      case LessonType.PRESENTATION:
        return <Presentation className="h-5 w-5 text-blue-600" />;
      case LessonType.DOCUMENT:
        return <FileText className="h-5 w-5 text-purple-600" />;
      case LessonType.INTERACTIVE:
        return <Target className="h-5 w-5 text-orange-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const getProgressPercentage = () => {
    if (lessons.length === 0) return 0;
    const totalLessons = lessons.filter(l => l.contentType === 'LESSON').length;
    return totalLessons > 0 ? (completedLessons.size / totalLessons) * 100 : 0;
  };

  if (loading) {
    return (
      <LearnerLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </LearnerLayout>
    );
  }

  if (!assignment) {
    return (
      <LearnerLayout>
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Formation non trouvée</h2>
          <p className="text-gray-600 mb-4">Cette formation n'existe pas ou vous n'y avez pas accès.</p>
          <button
            onClick={() => navigate('/apprenant/courses')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux formations
          </button>
        </div>
      </LearnerLayout>
    );
  }

  const { formation, status, progress } = assignment;

  return (
    <LearnerLayout>
      <div className="space-y-6">
        {/* Header avec navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/apprenant/courses')}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{formation.title}</h1>
            <p className="text-gray-600">Formation • {formatDuration(formation.duration)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de la formation */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {formation.coverImage && (
                <div className="h-64 bg-gray-200">
                  <img
                    src={formation.coverImage}
                    alt={formation.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === FormationStatus.NOT_STARTED ? 'bg-gray-100 text-gray-800' :
                      status === FormationStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                      status === FormationStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {status === FormationStatus.NOT_STARTED ? 'Non commencée' :
                       status === FormationStatus.IN_PROGRESS ? 'En cours' :
                       status === FormationStatus.COMPLETED ? 'Terminée' :
                       'En retard'}
                    </span>
                    
                    {formation.hasQuiz && (
                      <span className="flex items-center text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-1" />
                        Quiz inclus
                      </span>
                    )}
                  </div>

                  {status === FormationStatus.NOT_STARTED && (
                    <button
                      onClick={handleStartFormation}
                      disabled={startingFormation}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      <span>{startingFormation ? 'Démarrage...' : 'Commencer'}</span>
                    </button>
                  )}
                </div>

                {formation.description && (
                  <p className="text-gray-700 mb-6">{formation.description}</p>
                )}

                {/* Métadonnées */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(formation.duration)}</span>
                  </div>
                  
                  {formation.organization && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{formation.organization}</span>
                    </div>
                  )}
                  
                  {assignment.dueDate && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Échéance: {new Date(assignment.dueDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{lessons.filter(l => l.contentType === 'LESSON').length} leçons</span>
                  </div>
                </div>

                {/* Progression */}
                {status !== FormationStatus.NOT_STARTED && (
                  <div className="mt-6">
                    <ProgressBar
                      progress={getProgressPercentage()}
                      status={status === FormationStatus.COMPLETED ? 'completed' : 'in_progress'}
                      size="md"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Contenu de la leçon actuelle */}
            {currentLesson && status !== FormationStatus.NOT_STARTED && (
              <LessonViewer
                lesson={currentLesson}
                onComplete={handleLessonComplete}
                onProgress={handleLessonProgress}
                autoStart={false}
              />
            )}

            {/* Objectifs de la formation */}
            {formation.objectives && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Objectifs pédagogiques
                </h3>
                <ul className="space-y-2">
                  {JSON.parse(formation.objectives).map((objective: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar avec le contenu */}
          <div className="space-y-6">
            {/* Plan de la formation */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Plan de la formation</h3>
              </div>
              
              <div className="p-4 space-y-2">
                {lessons.map((item) => {
                  if (item.contentType === 'SECTION') {
                    const isExpanded = expandedSections.has(item.id);
                    const sectionLessons = lessons.filter(l => l.sectionId === item.id);
                    const completedInSection = sectionLessons.filter(l => completedLessons.has(l.id)).length;
                    
                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => toggleSection(item.id)}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{item.title}</span>
                            {sectionLessons.length > 0 && (
                              <span className="text-xs text-gray-500">
                                ({completedInSection}/{sectionLessons.length})
                              </span>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        
                        {isExpanded && sectionLessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => setCurrentLesson(lesson)}
                            disabled={status === FormationStatus.NOT_STARTED}
                            className={`w-full flex items-center space-x-3 p-3 ml-6 text-left rounded-lg transition-colors ${
                              currentLesson?.id === lesson.id
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-gray-50'
                            } ${status === FormationStatus.NOT_STARTED ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {getLessonIcon(lesson.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {lesson.title}
                              </p>
                              {lesson.duration && (
                                <p className="text-xs text-gray-500">
                                  {formatDuration(lesson.duration)}
                                </p>
                              )}
                            </div>
                            {completedLessons.has(lesson.id) && (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  }
                  
                  // Leçons sans section
                  if (item.contentType === 'LESSON' && !item.sectionId) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentLesson(item)}
                        disabled={status === FormationStatus.NOT_STARTED}
                        className={`w-full flex items-center space-x-3 p-3 text-left rounded-lg transition-colors ${
                          currentLesson?.id === item.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        } ${status === FormationStatus.NOT_STARTED ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {getLessonIcon(item.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </p>
                          {item.duration && (
                            <p className="text-xs text-gray-500">
                              {formatDuration(item.duration)}
                            </p>
                          )}
                        </div>
                        {completedLessons.has(item.id) && (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  }
                  
                  return null;
                })}
                
                {lessons.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Aucun contenu disponible
                  </p>
                )}
              </div>
            </div>

            {/* Quiz */}
            {formation.hasQuiz && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Award className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">Quiz d'évaluation</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Testez vos connaissances avec le quiz de fin de formation.
                </p>
                <button
                  disabled={status !== FormationStatus.IN_PROGRESS}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Passer le quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </LearnerLayout>
  );
};

export default CourseDetailPage;
