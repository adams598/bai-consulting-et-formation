// LessonPlayer.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, FileText, Video, Presentation, Clock, CheckCircle, BookOpen, Lock, Edit, RefreshCw, HelpCircle, Plus, XCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { FormationContent, Quiz } from '../types';
import { getLessonImageUrl, getImageUrl, getLessonFileUrl } from '../../../utils/imageUtils';
import TestViewer from './TestViewer';
import QuizConfigModal from './QuizConfigModal';
import '../../../components/LessonPlayer.css';
import { useAuth } from '../../../providers/auth-provider';
import progressService from '../../../services/progressService';
import { authService } from '../../../services/authService';
import { formationsApi, quizApi as learnerQuizApi } from '../../../api/learnerApi';
import { quizApi as adminQuizApi } from '../../../api/adminApi';

interface LessonPlayerProps {
  formation: {
    id: string;
    title: string;
    description?: string;
    duration?: number; // Ajouter la durée de la formation
    universeId?: string;
  };
  lessons: FormationContent[];
  initialSelectedLesson?: FormationContent | null;
  onClose: () => void;
  onProgressUpdate?: (lessonId: string, progress: {
    timeSpent?: number;
    progress?: number;
    completed?: boolean;
  }) => void;
  onLessonUpdate?: (updatedLesson: FormationContent) => void;
}

interface LessonProgress {
  lessonId: string;
  timeSpent: number; // en secondes
  progress: number; // 0-100
  completed: boolean;
}

// Composant Quiz Player Inline (extrait hors du composant parent pour conserver son état)
const InlineQuizPlayer = ({ quiz, onComplete, onClose }: { quiz: Quiz; onComplete: (result: any) => void; onClose: () => void }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number | number[] | string | string[]>>({});
  const [showResults, setShowResults] = React.useState(false);
  const [showReview, setShowReview] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  const [startTime, setStartTime] = React.useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number | string, isMultiple: boolean = false) => {
    if (isMultiple && typeof answerIndex === 'number') {
      setSelectedAnswers(prev => {
        const current = prev[questionIndex];
        let currentArray: number[] = [];
        if (Array.isArray(current)) {
          currentArray = current.filter(c => typeof c === 'number') as number[];
        } else if (typeof current === 'number') {
          currentArray = [current];
        }
        const newArray = currentArray.includes(answerIndex)
          ? currentArray.filter(id => id !== answerIndex)
          : [...currentArray, answerIndex];
        if (newArray.length === 0) {
          const newPrev = { ...prev };
          delete newPrev[questionIndex];
          return newPrev;
        }
        return { ...prev, [questionIndex]: newArray as number[] };
      });
    } else if (!isMultiple) {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionIndex]: answerIndex
      }));
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach((question, qIndex) => {
      const selected = selectedAnswers[qIndex];
      const points = question.points || 1;
      totalPoints += points;

      let questionIsCorrect = false;

      if (question.type === 'multiple_choice') {
        const correctIndices = question.answers
          .map((a, i) => a.isCorrect ? i : -1)
          .filter(i => i !== -1);
        const selectedIndices = Array.isArray(selected) ? (selected as number[]) : (typeof selected === 'number' ? [selected] : []);
        const allMatch = correctIndices.length === selectedIndices.length && correctIndices.every(ci => selectedIndices.includes(ci));
        questionIsCorrect = allMatch;
      } else if (question.type === 'text' || question.type === 'fill_in_blank') {
        if (typeof selected === 'string') {
          const normalized = selected.trim().toLowerCase();
          questionIsCorrect = question.answers.some(a => typeof a.answer === 'string' && a.answer.trim().toLowerCase() === normalized);
        } else if (Array.isArray(selected)) {
          const normalized = (selected as string[]).map(s => (s || '').trim().toLowerCase());
          const correctTexts = question.answers.filter(a => a.isCorrect).map(a => (a.answer || '').trim().toLowerCase());
          questionIsCorrect = correctTexts.every(ct => normalized.includes(ct));
        }
      } else {
        if (typeof selected === 'number') {
          const ans = question.answers[selected];
          questionIsCorrect = !!ans && !!ans.isCorrect;
        }
      }

      if (questionIsCorrect) {
        earnedPoints += points;
        correctAnswers += 1;
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    return {
      percentage,
      passed: percentage >= (quiz.passingScore || 80),
      totalPoints,
      earnedPoints,
      correctAnswers,
      totalQuestions: quiz.questions.length
    };
  };
  const handleSubmitQuiz = React.useCallback(async () => {
    setIsSubmitting(true);
    const results = calculateScore();

    const answersForApi: Record<string, string | string[]> = {};
    quiz.questions.forEach((question, qIndex) => {
      const selectedAnswer = selectedAnswers[qIndex];
      if (selectedAnswer !== undefined) {
        if (question.type === 'fill_in_blank') {
          if (Array.isArray(selectedAnswer)) {
            answersForApi[question.id] = selectedAnswer.filter((ans): ans is string => typeof ans === 'string');
          } else if (typeof selectedAnswer === 'string') {
            answersForApi[question.id] = [selectedAnswer];
          }
        } else if (Array.isArray(selectedAnswer) && question.type === 'multiple_choice') {
          const indices = selectedAnswer.filter((val): val is number => typeof val === 'number');
          answersForApi[question.id] = indices.map(index => question.answers[index].id);
        } else if (typeof selectedAnswer === 'number') {
          answersForApi[question.id] = question.answers[selectedAnswer].id;
        } else if (typeof selectedAnswer === 'string') {
          answersForApi[question.id] = selectedAnswer;
        }
      }
    });

    try {
      try {
        const startResp = await learnerQuizApi.startQuizAttempt(quiz.id);
        const attempt = startResp && (startResp as any).data ? (startResp as any).data : startResp;
        const attemptId = attempt?.id;
        if (attemptId) {
          const answersForApiStringOnly: Record<string, string> = {};
          Object.entries(answersForApi).forEach(([key, value]) => {
            answersForApiStringOnly[key] = Array.isArray(value) ? value.join(',') : value;
          });
          await learnerQuizApi.submitQuizAttempt(attemptId, answersForApiStringOnly);
        } else {
          console.warn('Impossible de démarrer une tentative pour le quiz');
        }
      } catch (err) {
        console.error('Erreur démarrage/soumission tentative (learner API):', err);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des résultats:', error);
    }

    onComplete({
      score: results.percentage,
      isPassed: results.passed,
      totalScore: results.totalPoints,
      userScore: results.earnedPoints,
      correctAnswers: results.correctAnswers,
      totalQuestions: results.totalQuestions,
      answers: selectedAnswers
    });
    setShowResults(true);
    setIsSubmitting(false);
  }, [selectedAnswers, quiz, onComplete]);

  React.useEffect(() => {
    if (quiz.timeLimit && !startTime && !showResults) {
      setTimeLeft(quiz.timeLimit * 60);
      setStartTime(new Date());
    }
  }, [quiz.timeLimit, startTime, showResults]);

  React.useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || showResults) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResults, handleSubmitQuiz]);

  const results = showResults ? calculateScore() : null;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const correctAnswersCount = currentQuestion ? currentQuestion.answers.filter(a => a.isCorrect).length : 0;
  const isMultipleChoice = currentQuestion?.type === "multiple_choice" && correctAnswersCount > 1;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
      {!showResults ? (
        <>
          {/* Mode Quiz - Design minimaliste */}
          <main className="w-full flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
            <div className="w-full max-w-4xl">
              {/* Compteur et titre */}
              <div className="text-center mb-16 space-y-4">
                <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-600 uppercase">
                  Question {currentQuestionIndex + 1} sur {quiz.questions.length}
                </span>
                <h1 className="text-3xl md:text-4xl font-medium text-slate-800 dark:text-slate-200 leading-tight max-w-2xl mx-auto">
                  {currentQuestion?.question}
                </h1>
              </div>

              {/* Réponses */}
              <div className="w-full max-w-2xl mx-auto">
                {currentQuestion?.type === 'text' ? (
                  <textarea
                    value={typeof selectedAnswers[currentQuestionIndex] === 'string' ? selectedAnswers[currentQuestionIndex] as string : ''}
                    onChange={(e) => handleAnswerSelect(currentQuestionIndex, e.target.value, false)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                  />
                ) : currentQuestion?.type === 'fill_in_blank' ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">{/* ... */}</div>
                  </div>
                ) : currentQuestion?.type === 'true_false' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-16">
                    {currentQuestion.answers.map((answer, aIndex) => {
                      const selected = selectedAnswers[currentQuestionIndex];
                      const isSelected = selected === aIndex;
                      return (
                        <label key={aIndex} className="relative block cursor-pointer group">
                          <input
                            type="radio"
                            name={`question-${currentQuestionIndex}`}
                            className="peer sr-only"
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(currentQuestionIndex, aIndex, false)}
                          />
                          <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 peer-checked:border-blue-600 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 peer-checked:ring-4 peer-checked:ring-blue-500/10">
                            <span className="text-2xl font-semibold text-slate-700 dark:text-slate-300">{answer.answer}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3 mb-12">
                    {currentQuestion?.answers.map((answer, aIndex) => {
                      const selected = selectedAnswers[currentQuestionIndex];
                      const isSelected = currentQuestion?.type === "multiple_choice" ? Array.isArray(selected) && selected.some((val) => val === aIndex) : selected === aIndex;
                      return (
                        <label key={aIndex} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                          <input type={currentQuestion?.type === "multiple_choice" ? "checkbox" : "radio"} name={`question-${currentQuestionIndex}`} checked={isSelected} onChange={() => handleAnswerSelect(currentQuestionIndex, aIndex, currentQuestion?.type === "multiple_choice")} />
                          <span className="text-gray-900">{answer.answer}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Boutons Précédent/Suivant */}
              <div className="flex items-center justify-center gap-12 mt-8 w-full max-w-2xl mx-auto">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="text-xl transition-transform group-hover:-translate-x-1 h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Précédent</span>
                </button>
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    className="group flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wider">Suivant</span>
                    <ChevronRight className="text-xl transition-transform group-hover:translate-x-1 h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                    className="group flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wider">{isSubmitting ? 'Soumission...' : 'Terminer'}</span>
                    <ChevronRight className="text-xl transition-transform group-hover:translate-x-1 h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </main>

          {/* Barre de progression en bas */}
          <div className="fixed bottom-0 left-0 w-full h-1 bg-slate-50 dark:bg-slate-900/50">
            <div
              className="h-full bg-blue-500/40 dark:bg-blue-600/60 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
          <div className="max-w-4xl mx-auto w-full h-full overflow-y-auto p-6">
            {!showReview ? (
              <>
                {!results!.passed ? (
                  <>
                    {/* Écran d'échec - conformité maquette */}
                    <div className="bg-white rounded-lg p-8">
                      {/* Icône et titre */}
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center h-16 w-16 bg-red-100 rounded-full mb-4">
                          <HelpCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-red-500 mb-2">Pas tout à fait...</h1>
                        <p className="text-gray-600">Vous avez presque réussi ! Il ne reste qu'un petit pas à franchir.</p>
                      </div>

                      {/* Score vs Objectif */}
                      <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">VOTRE SCORE</div>
                          <div className="text-3xl font-bold text-red-500 mb-1">{results!.percentage}%</div>
                          <div className="text-sm text-gray-600">({results!.earnedPoints}/{results!.totalPoints} points)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">OBJECTIF</div>
                          <div className="text-3xl font-bold text-gray-900">{quiz.passingScore}%</div>
                          <div className="text-sm text-gray-600">(seuil requis)</div>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="mb-8">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{ width: `${results!.percentage}%` }} />
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <button onClick={() => setShowReview(true)} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                          <BookOpen className="h-4 w-4" />
                          Revue du quiz
                        </button>
                        <button onClick={() => { setCurrentQuestionIndex(0); setSelectedAnswers({}); setShowResults(false); setShowReview(false); setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : null); setStartTime(null); }} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center gap-2 transition-colors">
                          <RefreshCw className="h-4 w-4" />
                          Recommencer le quiz
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Écran de succès */}
                    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                      <div className="w-full max-w-[720px] bg-white rounded-xl shadow-sm border border-slate-200 p-8 md:p-12">
                        <div className="text-center space-y-4">
                          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 text-green-600 mb-2">
                            <span className="text-5xl">🏆</span>
                          </div>
                          <h1 className="text-4xl font-bold tracking-tight text-green-600">Félicitations !</h1>
                          <p className="text-slate-600 text-lg">Excellent travail ! Vous avez brillamment validé ce module.</p>
                        </div>

                        <div className="mt-10 mb-12">
                          <div className="flex flex-col md:flex-row gap-6 mb-8">
                            <div className="flex-1 flex flex-col gap-2 rounded-lg p-6 border border-green-200 bg-green-50">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Score</p>
                              <p className="text-3xl font-bold text-green-600">{results!.percentage}%</p>
                            </div>
                            <div className="flex-1 flex flex-col gap-2 rounded-lg p-6 border border-slate-100 bg-slate-50">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Objectif</p>
                              <p className="text-3xl font-bold text-gray-700">{quiz.passingScore}%</p>
                            </div>
                          </div>

                          <div className="relative pt-2">
                            <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2 px-1">
                              <span>Progression du quiz</span>
                              <span>{results!.percentage}%</span>
                            </div>
                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-600 rounded-full transition-all duration-1000" style={{ width: `${results!.percentage}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-6 border border-green-100 mb-6">
                          <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2">
                            <span className="text-xl">✅</span>
                            Succès
                          </h3>
                          {/* <p className="text-gray-700 text-sm mb-4">Vous avez démontré une maîtrise complète des sujets abordés. Voici les compétences validées :</p>
                          <div className="flex flex-wrap gap-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-green-200 text-sm font-medium text-gray-700">Planification stratégique</div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-green-200 text-sm font-medium text-gray-700">Optimisation des processus</div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-green-200 text-sm font-medium text-gray-700">Leadership d'équipe</div>
                          </div> */}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <button onClick={onClose} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg">
                            <span>Continuer</span>
                              <ChevronRight className="h-5 w-5" />
                          </button>
                          <button onClick={() => setShowReview(true)} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold py-4 rounded-xl transition-all">
                            <RefreshCw className="h-5 w-5" />
                            Revoir le quiz
                          </button>
                        </div>

                        <p className="text-center text-gray-400 text-xs mt-8">Ce module est désormais marqué comme complété dans votre parcours de formation.</p>
                      </div>
                    </main>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Revue du quiz */}
                <div>
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900">Revue du quiz</h2>
                    </div>

                    <div className="space-y-6">
                      {quiz.questions.map((question, qIndex) => {
                        const selected = selectedAnswers[qIndex];
                        let isCorrect = false;
                        let userAnswerText = '';

                        if (question.type === 'multiple_choice') {
                          const correctIndices = question.answers
                            .map((a, i) => a.isCorrect ? i : -1)
                            .filter(i => i !== -1);
                          const selectedIndices = Array.isArray(selected) ? (selected as number[]) : (typeof selected === 'number' ? [selected] : []);
                          isCorrect = correctIndices.length === selectedIndices.length && correctIndices.every(ci => selectedIndices.includes(ci));
                          if (typeof selected === 'number') {
                            userAnswerText = question.answers[selected]?.answer || '';
                          }
                        } else if (typeof selected === 'number') {
                          const ans = question.answers[selected];
                          isCorrect = !!ans && !!ans.isCorrect;
                          userAnswerText = ans?.answer || '';
                        } else if (typeof selected === 'string') {
                          userAnswerText = selected;
                          const normalized = selected.trim().toLowerCase();
                          isCorrect = question.answers.some(a => typeof a.answer === 'string' && a.answer.trim().toLowerCase() === normalized);
                        }

                        return (
                          <div key={qIndex} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-semibold text-gray-900 flex-1">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">QUESTION {qIndex + 1}</span>
                                <div className="mt-1">{question.question}</div>
                              </h3>
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isCorrect ? (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Correct
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    Incorrect
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Réponse de l'utilisateur */}
                            <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200">
                              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Votre réponse</div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-gray-900">{userAnswerText}</span>
                              </div>
                            </div>


                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bouton retour */}
                  <div className="flex justify-center pt-6 border-t border-gray-200">
                    <button onClick={() => setShowReview(false)} className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      ← Retour aux résultats
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
    </div>
  );
};

export default function LessonPlayer({ formation, lessons: rawLessons, initialSelectedLesson, onClose, onProgressUpdate, onLessonUpdate }: LessonPlayerProps) {
  const { user } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<FormationContent | null>(null);
  const [lessonProgress, setLessonProgress] = useState<{[key: string]: LessonProgress}>({});
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // États pour la gestion du quiz
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isQuizSelected, setIsQuizSelected] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    isPassed: boolean;
    totalScore: number;
    userScore: number;
    correctAnswers?: number;
    totalQuestions?: number;
    answers?: Record<string, string | string[]>;
  } | null>(null);
  const [lastAttempt, setLastAttempt] = useState<any | null>(null);
  const [showQuizRecap, setShowQuizRecap] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [hasAutoTransitionedToQuiz, setHasAutoTransitionedToQuiz] = useState(false);
  const [quizAvailable, setQuizAvailable] = useState(false);

  // Debug: log du montage et de l'identité courante
  useEffect(() => {
    try {
      console.log('🧭 LessonPlayer mounted', { formationId: formation.id, userId: getCurrentUserId() });
    } catch (e) {
      console.warn('LessonPlayer mount log failed', e);
    }
  }, [formation.id]);

  // Transformer les données des leçons pour s'assurer que toutes les propriétés sont bien définies
  // Principe similaire à la transformation des formations dans LearnerFormationsPage
  const lessons = React.useMemo(() => {
    return rawLessons.map((lesson: any) => ({
      id: lesson.id,
      formationId: lesson.formationId,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      contentType: lesson.contentType,
      sectionId: lesson.sectionId,
      order: lesson.order,
      duration: formation.duration || 0, // Utiliser la durée de la formation pour toutes les leçons
      fileUrl: lesson.fileUrl,
      fileSize: lesson.fileSize,
      coverImage: lesson.coverImage,
      metadata: lesson.metadata,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    }));
  }, [rawLessons, formation.duration]);

  // Fonction pour récupérer l'ID utilisateur
  const getCurrentUserId = () => {
    if (user && user.id) {
      return user.id;
    }
    
    // Fallback : essayer de récupérer depuis le localStorage
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        return userData.id || 'default-user-id';
      } catch (error) {
        console.error('Erreur parsing userInfo:', error);
      }
    }
    
    // Essayer de récupérer depuis le token JWT
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.userId || payload.sub) {
          return payload.userId || payload.sub;
        }
      } catch (error) {
        console.error('Erreur décodage token JWT:', error);
      }
    }
    
    return 'default-user-id';
  };

  // Fonction pour vérifier si l'utilisateur est admin
  const isAdmin = () => {
    const currentUser = authService.getCurrentUser();
    return currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'BANK_ADMIN');
  };

  // Fonction pour récupérer le quiz de la formation
  const fetchQuiz = async () => {
    setIsLoadingQuiz(true);
    console.log('📥 fetchQuiz start for formation:', formation.id);
    try {
      // Utiliser l'API learner pour récupérer la formation (incluant le quiz associé)
      const res = await formationsApi.getFormationById(formation.id);
      if (res && (res as any).data) {
        const data = (res as any).data;
        if (data.quiz) {
          setQuiz(data.quiz);
          console.log('📋 Quiz chargé (learner API) pour la formation:', formation.id, data.quiz);
          await fetchLastAttempt(data.quiz.id);
        } else {
          console.log('ℹ️ Aucun quiz associé retourné par formationsApi.getFormationById');
          setQuiz(null);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du quiz via learner API:', error);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Fonction pour récupérer la dernière tentative (via learner API)
  const fetchLastAttempt = async (quizId: string) => {
    try {
      const response = await learnerQuizApi.getQuizAttempts(quizId);
      const attempts = response && (response as any).data ? (response as any).data : response;
      if (Array.isArray(attempts) && attempts.length > 0) {
        const last = attempts[attempts.length - 1];
        setLastAttempt(last);
      } else {
        setLastAttempt(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la dernière tentative (learner API):', error);
      setLastAttempt(null);
    }
  };

  // Vérifier si toutes les leçons sont complétées
  const areAllLessonsCompleted = () => {
    // Filtrer uniquement les leçons (pas les sections)
    const actualLessons = lessons.filter(lesson => lesson.contentType === 'LESSON');
    
    if (actualLessons.length === 0) {
      return true; // Pas de leçons, le quiz peut être joué
    }
    
    // Vérifier que toutes les leçons sont complétées
    return actualLessons.every(lesson => {
      const progress = lessonProgress[lesson.id];
      return progress?.completed === true;
    });
  };

  // Fonction pour déterminer l'état du quiz et les actions disponibles
  const getQuizState = () => {
    const allLessonsCompleted = areAllLessonsCompleted();
    
    if (!quiz) {
      return {
        canPlay: false,
        canRetry: false,
        canFinish: false,
        buttonText: 'Jouer',
        buttonVariant: 'primary' as const,
        allLessonsCompleted: false,
        reason: 'Aucun quiz configuré'
      };
    }

    // Si toutes les leçons ne sont pas complétées et qu'il n'y a pas eu de tentative précédente
    if (!allLessonsCompleted && !lastAttempt) {
      return {
        canPlay: false,
        canRetry: false,
        canFinish: false,
        buttonText: 'Jouer',
        buttonVariant: 'primary' as const,
        allLessonsCompleted: false,
        reason: 'Complétez d\'abord toutes les leçons'
      };
    }

    if (!lastAttempt) {
      return {
        canPlay: allLessonsCompleted,
        canRetry: false,
        canFinish: false,
        buttonText: 'Jouer',
        buttonVariant: 'primary' as const,
        allLessonsCompleted,
        reason: allLessonsCompleted ? undefined : 'Complétez d\'abord toutes les leçons'
      };
    }

    const score = lastAttempt.score;
    // answers peut être soit une string (JSON) soit déjà un objet
    let answersObj = null;
    if (lastAttempt.answers) {
      if (typeof lastAttempt.answers === 'string') {
        try {
          answersObj = JSON.parse(lastAttempt.answers);
        } catch (e) {
          console.error('Erreur parsing answers:', e);
          answersObj = null;
        }
      } else {
        answersObj = lastAttempt.answers;
      }
    }
    const correctAnswers = answersObj ? Object.keys(answersObj).length : 0;

    // 100% = Terminer uniquement (peut toujours être cliqué même si leçons non complétées)
    if (score === 100) {
      return {
        canPlay: false,
        canRetry: false,
        canFinish: true,
        buttonText: 'Terminer',
        buttonVariant: 'success' as const,
        allLessonsCompleted: true,
        reason: undefined
      };
    }

    // Réussi entre 80-99% = Rejouer (optionnel) + Terminer (mis en avant)
    if (score >= quiz.passingScore && score < 100) {
      return {
        canPlay: false,
        canRetry: allLessonsCompleted, // Rejouer seulement si toutes les leçons sont complétées
        canFinish: true,
        buttonText: 'Rejouer',
        buttonVariant: 'secondary' as const,
        primaryAction: 'finish' as const,
        allLessonsCompleted,
        reason: allLessonsCompleted ? undefined : 'Complétez toutes les leçons pour rejouer'
      };
    }

    // Échec <80% = Rejouer (obligatoire, mais seulement si toutes les leçons sont complétées)
    if (score < quiz.passingScore) {
      return {
        canPlay: false,
        canRetry: allLessonsCompleted, // Rejouer seulement si toutes les leçons sont complétées
        canFinish: false,
        buttonText: 'Rejouer',
        buttonVariant: 'warning' as const,
        allLessonsCompleted,
        reason: allLessonsCompleted ? 'Vous devez rejouer le quiz' : 'Complétez toutes les leçons avant de rejouer'
      };
    }

    return {
      canPlay: allLessonsCompleted,
      canRetry: false,
      canFinish: false,
      buttonText: 'Jouer',
      buttonVariant: 'primary' as const,
      allLessonsCompleted,
      reason: allLessonsCompleted ? undefined : 'Complétez d\'abord toutes les leçons'
    };
  };

  // Fonction pour sauvegarder le quiz
  const handleSaveQuiz = async (quizData: any) => {
    try {
      // console.log('💾 Sauvegarde du quiz:', quizData);
      
      if (quiz && quiz.id) {
        // Mise à jour du quiz existant (admin API)
        const response = await adminQuizApi.updateQuiz(quiz.id, {
          title: quizData.title || '',
          description: quizData.description || '',
          passingScore: quizData.passingScore || 80,
          timeLimit: quizData.timeLimit || undefined,
          questions: quizData.questions || []
        });
        
        if (response.data && response.data.success) {
          setQuiz(response.data.data);
          setSuccessMessage('Quiz mis à jour avec succès !');
          setTimeout(() => setSuccessMessage(null), 5000);
          await fetchQuiz();
        }
      } else {
        // Création d'un nouveau quiz (admin API)
        const response = await adminQuizApi.createQuiz(formation.id, {
          title: quizData.title || '',
          description: quizData.description || '',
          passingScore: quizData.passingScore || 80,
          timeLimit: quizData.timeLimit || undefined,
          questions: quizData.questions || []
        });
        
        if (response.data && response.data.success) {
          setQuiz(response.data.data);
          setSuccessMessage('Quiz créé avec succès !');
          setTimeout(() => setSuccessMessage(null), 5000);
          await fetchQuiz();
        }
      }
      setShowQuizModal(false);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du quiz:', error);
      setSuccessMessage('Erreur lors de la sauvegarde du quiz');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  // Fonction pour calculer la durée réelle de la vidéo
  const calculateVideoDuration = async (lessonId: string): Promise<number> => {
    // console.log('🔄 Calcul de la durée pour la leçon:', lessonId);
    
    // Essayer d'abord l'API (même si elle n'existe pas encore)
    try {
      const response = await fetch(`http://localhost:3000/api/admin/lessons/${lessonId}/duration`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const duration = data.duration || 0;
        // console.log('🎥 Durée calculée via l\'API:', duration, 'secondes');
        return duration;
      } else {
        console.log('⚠️ API non disponible (404), passage au fallback...');
      }
    } catch (apiError) {
      console.log('⚠️ Erreur API, passage au fallback:', apiError);
    }
    
    // Fallback: utiliser fetch authentifié pour récupérer la vidéo
    try {
      // console.log('🔄 Tentative avec fetch authentifié...');
      
      const videoUrl = buildLessonFileUrl(selectedLesson!);
      // console.log('🎥 URL de la vidéo:', videoUrl);
      
      // Essayer de récupérer la vidéo avec authentification
      const videoResponse = await fetch(videoUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!videoResponse.ok) {
        throw new Error(`Erreur fetch vidéo: ${videoResponse.status}`);
      }
      
      // Créer un blob URL temporaire
      const videoBlob = await videoResponse.blob();
      const blobUrl = URL.createObjectURL(videoBlob);
      
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration);
          // console.log('🎥 Durée calculée via blob:', duration, 'secondes');
          URL.revokeObjectURL(blobUrl); // Nettoyer le blob URL
          resolve(duration);
        };
        
        video.onerror = (e) => {
          console.error('❌ Erreur lors du chargement de la vidéo blob:', e);
          URL.revokeObjectURL(blobUrl); // Nettoyer le blob URL
          reject(new Error('Impossible de charger la vidéo blob'));
        };
        
        video.src = blobUrl;
      });
      
    } catch (fallbackError) {
      console.error('❌ Erreur fallback:', fallbackError);
      throw new Error('Impossible de calculer la durée de la vidéo');
    }
  };

  // Fonction pour recalculer la durée de la leçon
  const handleRecalculateDuration = async () => {
    if (!selectedLesson || !selectedLesson.fileUrl) {
      // console.log('❌ Aucune leçon sélectionnée ou pas de fichier vidéo');
      return;
    }

    setIsCalculatingDuration(true);
    setSuccessMessage(null);
    
    try {
      // console.log('🔄 Calcul de la durée pour la leçon:', selectedLesson.title);
      
      // Calculer la durée via l'API ou fallback
      const realDuration = await calculateVideoDuration(selectedLesson.id);
      
      // console.log('✅ Durée réelle calculée:', realDuration, 'secondes');
      // console.log('📊 Durée actuelle de la formation:', formation.duration, 'secondes');
      
      // Mettre à jour la formation dans la base de données
      try {
        // console.log('💾 Mise à jour de la formation dans la BDD...');
        
        const response = await fetch(`http://localhost:3000/api/admin/formations/${formation.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formation.title, // Champ obligatoire
            description: formation.description || '',
            duration: realDuration
          })
        });
        
        if (response.ok) {
          // console.log('✅ Formation mise à jour dans la BDD avec la durée:', realDuration, 'secondes');
          
          // Mettre à jour la leçon avec la durée réelle
          const updatedLesson = {
            ...selectedLesson,
            duration: realDuration
          };
          
          setSelectedLesson(updatedLesson);
          
          // Appeler la fonction parent pour sauvegarder
          if (onLessonUpdate) {
            onLessonUpdate(updatedLesson);
          }
          
          // Afficher le message de succès
          setSuccessMessage(`✅ Durée mise à jour avec succès ! Nouvelle durée : ${realDuration} secondes`);
          
          // Masquer le message après 5 secondes
          setTimeout(() => {
            setSuccessMessage(null);
          }, 5000);
          
          // console.log('💾 Leçon mise à jour avec la durée réelle:', realDuration, 'secondes');
          
        } else {
          throw new Error(`Erreur lors de la mise à jour de la formation: ${response.status}`);
        }
        
      } catch (dbError) {
        console.error('❌ Erreur lors de la mise à jour de la BDD:', dbError);
        
        // Mettre à jour quand même localement
        const updatedLesson = {
          ...selectedLesson,
          duration: realDuration
        };
        
        setSelectedLesson(updatedLesson);
        
        if (onLessonUpdate) {
          onLessonUpdate(updatedLesson);
        }
        
        setSuccessMessage(`⚠️ Durée calculée (${realDuration}s) mais erreur lors de la sauvegarde en BDD`);
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du calcul de la durée:', error);
      setSuccessMessage('❌ Erreur lors du calcul de la durée de la vidéo');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } finally {
      setIsCalculatingDuration(false);
    }
  };

  // Charger les progressions au montage du composant
  useEffect(() => {
    const loadProgressions = () => {
      try {
        const userId = getCurrentUserId();
        const progress = progressService.getProgress(formation.id, userId, lessons);
        setLessonProgress(progress);
        // console.log('📊 Progressions chargées dans LessonPlayer:', progress);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des progressions:', error);
      }
    };

    if (lessons.length > 0) {
      loadProgressions();
    }
    
    // Recharger les progressions périodiquement pour détecter les changements
    // (utile quand une leçon est complétée dans un autre onglet ou composant)
    const interval = setInterval(() => {
      if (lessons.length > 0) {
        loadProgressions();
      }
    }, 3000); // Recharger toutes les 3 secondes
    
    return () => clearInterval(interval);
  }, [formation.id, lessons]);

  // Charger le quiz au montage du composant
  useEffect(() => {
    fetchQuiz();
  }, [formation.id]);

  // Effet de débogage pour surveiller l'état de la modal
  useEffect(() => {
    if (showQuizModal) {
      // console.log('📌 showQuizModal est maintenant true, la modal devrait s\'afficher');
    }
  }, [showQuizModal]);

  // Sélectionner automatiquement la première leçon ou la leçon initiale
  useEffect(() => {
    if (lessons.length > 0 && !selectedLesson) {
      if (initialSelectedLesson) {
        setSelectedLesson(initialSelectedLesson);
      } else {
        setSelectedLesson(lessons[0]);
      }
    }
  }, [lessons, selectedLesson, initialSelectedLesson]);

  // Vérifier si une leçon est accessible (logique séquentielle stricte)
  const isLessonAccessible = (lesson: FormationContent, index: number) => {
    // La première leçon est toujours accessible
    if (index === 0) return true;
    
    // Pour les autres leçons, vérifier que TOUTES les leçons précédentes sont terminées
    for (let i = 0; i < index; i++) {
      const previousLesson = lessons[i];
      if (!previousLesson) continue;
      
      const previousProgress = lessonProgress[previousLesson.id];
      if (!previousProgress?.completed) {
        return false; // Une leçon précédente n'est pas terminée
      }
    }
    
    return true; // Toutes les leçons précédentes sont terminées
  };

  const handleLessonSelect = (lesson: FormationContent) => {
    const lessonIndex = lessons.findIndex(l => l.id === lesson.id);
    const isAccessible = isLessonAccessible(lesson, lessonIndex);
    
    if (isAccessible) {
      setSelectedLesson(lesson);
      setIsQuizSelected(false); // Désélectionner le quiz si une leçon est sélectionnée
      setQuizResult(null);
      setHasAutoTransitionedToQuiz(false); // Réinitialiser le flag pour permettre la transition auto au quiz quand 100% est atteint
    } else {
      // console.log('🚫 Sélection bloquée pour', lesson.title, '- Leçon non accessible');
    }
  };

  const updateLessonProgress = (lessonId: string, progress: Partial<LessonProgress>) => {
    // Trouver l'index de la leçon
    const lessonIndex = lessons.findIndex(lesson => lesson.id === lessonId);
    if (lessonIndex === -1) return;

    // Vérifier si la leçon est accessible
    const isAccessible = isLessonAccessible(lessons[lessonIndex], lessonIndex);
    
    if (!isAccessible) {
      // console.log('🚫 Progression bloquée pour', lessons[lessonIndex].title, '- Leçon non accessible');
      return;
    }

    // Mettre à jour via le service de progression
    const userId = getCurrentUserId();
    progressService.updateProgress(formation.id, userId, lessonId, {
      timeSpent: progress.timeSpent || 0,
      progress: progress.progress || 0,
      completed: progress.completed || false
    });
    
    // Mettre à jour l'état local
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        ...progress,
        lessonId,
        lastUpdated: new Date().toISOString()
      }
    }));

    // Si la leçon vient d'atteindre 100% et que la formation n'est pas une opportunité commerciale,
    // indiquer que le quiz est disponible mais NE PAS le lancer automatiquement.
    if (progress.progress && progress.progress >= 100 && formation.universeId !== 'opportunites-commerciales') {
      console.log('📊 Progression à 100% détectée - universeId:', formation.universeId, 'quiz exists:', !!quiz);
      if (quiz) {
        setQuizAvailable(true);
        // garder l'utilisateur maître du lancement : il devra cliquer sur le bloc Quiz
      } else {
        console.log('⚠️ Progression à 100% mais aucun quiz trouvé');
      }
    }
    
    // Appeler la fonction parent si elle existe
    if (onProgressUpdate) {
      onProgressUpdate(lessonId, {
        timeSpent: progress.timeSpent || 0,
        progress: progress.progress || 0,
        completed: progress.completed || false
      });
    }
  };

  const getFileType = (lesson: FormationContent) => {
    if (lesson.fileUrl) {
      const extension = lesson.fileUrl.split('.').pop()?.toLowerCase();
      if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '')) return 'video';
      if (['pdf'].includes(extension || '')) return 'pdf';
      if (['docx', 'doc'].includes(extension || '')) return 'document';
      if (['pptx', 'ppt'].includes(extension || '')) return 'presentation';
    }
    return lesson.type.toLowerCase();
  };

  // Fonction pour construire l'URL du fichier de la leçon
  const buildLessonFileUrl = (lesson: FormationContent) => {
    // console.log('🔍 buildLessonFileUrl - lesson:', lesson);
    // console.log('🔍 buildLessonFileUrl - formation.title:', formation.title);
    // console.log('🔍 buildLessonFileUrl - lesson.title:', lesson.title);
    // console.log('🔍 buildLessonFileUrl - lesson.fileUrl:', lesson.fileUrl);
    
    // Utiliser la fonction importée de imageUtils avec l'URL Cloudinary si disponible
    const url = getLessonFileUrl(formation.title, lesson.title, undefined, lesson.fileUrl);
    // console.log('🔍 buildLessonFileUrl - URL générée:', url);
    return url;
  };


  const renderLessonContent = () => {
    if (!selectedLesson) return null;

    const fileType = getFileType(selectedLesson);

    // Utiliser TestViewer pour tous les types pour le moment
    // buildLessonFileUrl utilise déjà lesson.fileUrl si c'est une URL Cloudinary
    const fileUrl = buildLessonFileUrl(selectedLesson);
    
    // console.log('🎬 LessonPlayer - renderLessonContent:', {
    //   lessonId: selectedLesson.id,
    //   lessonTitle: selectedLesson.title,
    //   lessonFileUrl: selectedLesson.fileUrl,
    //   builtFileUrl: fileUrl,
    //   isCloudinary: selectedLesson.fileUrl?.startsWith('https://res.cloudinary.com') || selectedLesson.fileUrl?.startsWith('http://res.cloudinary.com')
    // });
    
    return (
      <TestViewer
        lesson={selectedLesson}
        fileUrl={fileUrl || undefined}
        formationId={formation.id}
        userId={getCurrentUserId()}
        onProgressUpdate={(progress: Partial<LessonProgress>) => updateLessonProgress(selectedLesson.id, progress)}
      />
    );
  };

  const renderQuizContent = () => {
    if (!quiz) return null;

    // Toujours afficher le quiz inline dans l'espace prévu.
    return (
      <InlineQuizPlayer
        quiz={quiz}
        onComplete={async (result) => {
          // Le composant Inline gère l'affichage du récapitulatif/résultats.
          // Ici on recharge simplement la dernière tentative pour mettre à jour l'historique.
          try {
            await fetchLastAttempt(quiz.id);
          } catch (e) {
            console.warn('Impossible de recharger la dernière tentative:', e);
          }
        }}
        onClose={() => setIsQuizSelected(false)}
      />
    );
  };

  // Inline quiz player has been moved to top-level `InlineQuizPlayer` to preserve state between renders

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Fonction pour formater la durée de la leçon (provenant de la BDD)
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return 'N/A';
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h`;
    }
  };

  return (
    <>
      {/* Overlay sombre */}
      <div className="fixed inset-0 bg-black bg-opacity-75 z-[9998]" onClick={onClose} />
      
      {/* Modale */}
      <div 
        className="fixed inset-0 bg-white z-[9999] flex flex-col shadow-2xl" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'white',
          zIndex: 9999
        }}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{formation.title}</h1>
            </div>
          </div>
          
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden bg-white">
          {/* Left Sidebar - Liste des leçons */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Leçons</h2>
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const progress = lessonProgress[lesson.id];
                  const isSelected = selectedLesson?.id === lesson.id;
                  const isAccessible = isLessonAccessible(lesson, index);
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleLessonSelect(lesson)}
                      className={`p-4 bg-white rounded-lg border-2 transition-all ${
                        !isAccessible
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : isSelected 
                            ? 'border-blue-500 bg-blue-50 cursor-pointer hover:shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer hover:shadow-md'
                      }`}
                    >
                      {/* Image de couverture
                      {lesson.coverImage ? (
                        <div className="mb-3 relative overflow-hidden rounded-lg">
                          <img
                            src={getLessonImageUrl(lesson.coverImage)}
                            alt={`Couverture de ${lesson.title}`}
                            className={`w-full h-20 object-cover ${
                              !isAccessible ? 'filter grayscale opacity-50' : ''
                            }`}
                          />
                          {!isAccessible && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Lock className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`mb-3 w-full h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center ${
                          !isAccessible ? 'opacity-50' : ''
                        }`}>
                          {!isAccessible ? (
                            <Lock className="h-8 w-8 text-gray-400" />
                          ) : (
                            getFileIcon(lesson)
                          )}
                        </div>
                      )} */}

                      {/* Titre et type */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
                          {lesson.title}
                        </h3>
                        <div className="flex items-center space-x-1 ml-2">
                          {/* {getFileIcon(lesson)} */}
                          {progress?.completed && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {/* Bouton d'édition pour les admins sur la carte */}
                          {isAdmin() && isSelected && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // console.log('🔍 MODIFIER - Clic détecté !');
                                setShowLessonModal(true);
                              }}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              title="Modifier cette leçon"
                              style={{ 
                                zIndex: 10,
                                position: 'relative'
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {lesson.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {/* {lesson.description} */}
                        </p>
                      )}

                      {/* Durée et temps passé */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(lesson.duration || 0)}</span>
                        </div>
                       
                      </div>

                      {/* Bouton d'action
                      <button
                        disabled={!isAccessible}
                        className={`w-full py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                          !isAccessible
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {!isAccessible ? (
                          <>
                            <Lock className="h-3 w-3 mr-1 inline" />
                            Verrouillée
                          </>
                        ) : (
                          getActionButtonText(lesson)
                        )}
                      </button> */}

                      {/* Barre de progression */}
                      {!isAccessible ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progression</span>
                            <span>0%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-gray-400 h-1.5 rounded-full w-0" />
                          </div>
                        </div>
                      ) : progress && progress.progress > 0 ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progression</span>
                            <span>{Math.round(progress.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {/* Carte Quiz pour les apprenants (toujours visible si quiz configuré) */}
                {quiz && !isAdmin() && (
                  <div
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !quizAvailable
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : isQuizSelected
                          ? 'border-purple-500 bg-purple-50 cursor-pointer hover:shadow-md'
                          : 'border-yellow-400 bg-yellow-50 cursor-pointer hover:shadow-md'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!quizAvailable) return; // bloqué tant que quizAvailable === false
                      setIsQuizSelected(true);
                      setSelectedLesson(null);
                    }}
                  >
                  <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className={`p-2 rounded-md ${quiz ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          <HelpCircle className={`h-5 w-5 ${quiz ? 'text-purple-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">
                            {quiz ? quiz.title : 'Quiz de validation'}
                          </h3>
                          {quiz && quiz.questions && (
                            <p className="text-xs text-gray-500 mt-1">
                              {quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>

                    {quiz && (
                      <>
                        <div className="mt-2 text-xs text-gray-500">
                          {lastAttempt ? (
                            <div>
                              <span>Dernier score: {lastAttempt.score}%</span>
                              {lastAttempt.isPassed ? (
                                <span className="ml-2 text-green-600">✓ Réussi</span>
                              ) : (
                                <span className="ml-2 text-red-600">✗ Échoué</span>
                              )}
                            </div>
                          ) : (
                            <span>Pas encore joué</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Carte Quiz pour les admins */}
                {isAdmin() && (
                  <div
                    className={`p-4 bg-white rounded-lg border-2 transition-all ${
                      !quiz
                        ? 'border-dashed border-gray-300 hover:border-blue-400 cursor-pointer hover:shadow-md'
                        : isQuizSelected
                          ? 'border-purple-500 bg-purple-50 cursor-pointer hover:shadow-md'
                          : 'border-purple-200 hover:border-purple-300 cursor-pointer hover:shadow-md'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!quiz) {
                        // Si pas de quiz, ouvrir la modal de configuration
                        // console.log('🎯 Clic sur la carte Quiz - ouverture de la modal, showQuizModal:', showQuizModal);
                        setShowQuizModal(true);
                        // console.log('✅ showQuizModal mis à true');
                      }
                      // Ne pas jouer automatiquement au clic sur la carte, utiliser les boutons
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className={`p-2 rounded-md ${
                          quiz 
                            ? 'bg-purple-100' 
                            : 'bg-gray-100'
                        }`}>
                          <HelpCircle className={`h-5 w-5 ${
                            quiz 
                              ? 'text-purple-600' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">
                            {quiz ? quiz.title : 'Quiz de validation'}
                          </h3>
                          {quiz && quiz.questions && (
                            <p className="text-xs text-gray-500 mt-1">
                              {quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {quiz ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowQuizModal(true);
                            }}
                            className="p-1 hover:bg-purple-100 rounded transition-colors"
                            title="Modifier le quiz"
                          >
                            <Edit className="h-4 w-4 text-purple-600" />
                          </button>
                        ) : (
                          <Plus className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </div>

                    {quiz && (
                      <>
                        <div className="mt-2 text-xs text-gray-500">
                          {lastAttempt ? (
                            <div>
                              <span>Dernier score: {lastAttempt.score}%</span>
                              {lastAttempt.isPassed ? (
                                <span className="ml-2 text-green-600">✓ Réussi</span>
                              ) : (
                                <span className="ml-2 text-red-600">✗ Échoué</span>
                              )}
                            </div>
                          ) : (
                            <span>Pas encore joué</span>
                          )}
                        </div>
                        
                        {/* Boutons d'action selon l'état */}
                        {(() => {
                          const quizState = getQuizState();
                          const canPlayQuiz = quizState.allLessonsCompleted;
                          const actualLessons = lessons.filter(l => l.contentType === 'LESSON');
                          const completedLessons = actualLessons.filter(l => lessonProgress[l.id]?.completed).length;
                          
                          return (
                            <div className="mt-3 flex flex-col space-y-2">
                              {/* Message informatif si toutes les leçons ne sont pas complétées */}
                              {!canPlayQuiz && quiz && (
                                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                  <p className="text-xs text-yellow-800">
                                    <Lock className="h-3 w-3 inline mr-1" />
                                    {completedLessons} / {actualLessons.length} leçon{actualLessons.length > 1 ? 's' : ''} complétée{actualLessons.length > 1 ? 's' : ''}
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    Complétez toutes les leçons pour accéder au quiz
                                  </p>
                                </div>
                              )}
                              
                              {quizState.canPlay && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (canPlayQuiz) {
                                      setIsQuizSelected(true);
                                      setSelectedLesson(null);
                                      setQuizResult(null);
                                    }
                                  }}
                                  disabled={!canPlayQuiz}
                                  className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                                    canPlayQuiz
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  Jouer
                                </button>
                              )}
                              
                              {quizState.canRetry && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (canPlayQuiz) {
                                      setIsQuizSelected(true);
                                      setSelectedLesson(null);
                                      setQuizResult(null);
                                    }
                                  }}
                                  disabled={!canPlayQuiz}
                                  className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                                    !canPlayQuiz
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : quizState.buttonVariant === 'warning'
                                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  Rejouer
                                </button>
                              )}
                              
                              {quizState.canFinish && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Action terminer : fermer le quiz
                                    setIsQuizSelected(false);
                                    setQuizResult(null);
                                  }}
                                  className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                                    quizState.primaryAction === 'finish'
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-green-500 text-white hover:bg-green-600'
                                  }`}
                                >
                                  Terminer
                                </button>
                              )}
                              
                              {lastAttempt && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowQuizRecap(true);
                                  }}
                                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                                >
                                  Récap
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {!quiz && (
                      <div className="flex items-center justify-center pt-2">
                        <span className="text-xs text-blue-600">
                          Cliquez pour ajouter un quiz de validation
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Contenu de la leçon ou quiz */}
          <div className="flex-1 bg-white overflow-hidden">
            {isQuizSelected && quiz ? (
              <div className="h-full overflow-y-auto">
                {renderQuizContent()}
              </div>
            ) : selectedLesson ? (
              <div className="h-full">
                {renderLessonContent()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Sélectionnez une leçon ou le quiz pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'édition de leçon personnalisé */}
      {showLessonModal && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du modal */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Modifier la leçon</h2>
              <button
                onClick={() => setShowLessonModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Informations de base */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de base</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre de la leçon
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedLesson.title}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de contenu
                      </label>
                      <select
                        defaultValue={selectedLesson.type}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="VIDEO">Vidéo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    defaultValue={selectedLesson.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description de la leçon..."
                  />
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (en secondes)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue={formation.duration || 0}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Durée en secondes"
                    />
                    <button
                      type="button"
                      onClick={handleRecalculateDuration}
                      disabled={isCalculatingDuration || !selectedLesson?.fileUrl}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      title="Recalculer la durée à partir de la vidéo"
                    >
                      <RefreshCw className={`h-4 w-4 ${isCalculatingDuration ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {isCalculatingDuration && (
                    <p className="text-sm text-blue-600 mt-1">🔄 Calcul de la durée en cours...</p>
                  )}
                </div>

                {/* Fichier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier de la leçon
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {selectedLesson.fileUrl && (
                      <span className="text-sm text-gray-500">
                        Fichier actuel: {selectedLesson.fileUrl.split('/').pop()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Image de couverture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image de couverture
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {selectedLesson.coverImage && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img
                          src={getLessonImageUrl(selectedLesson.coverImage)}
                          alt="Couverture actuelle"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer du modal */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLessonModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  // console.log('💾 Sauvegarde de la leçon:', selectedLesson);
                  setShowLessonModal(false);
                  // TODO: Implémenter la sauvegarde
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Message de succès */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-[10001] bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-in slide-in-from-right duration-300">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="flex-shrink-0 ml-4 text-green-200 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal de configuration du Quiz - Rendu via portail pour éviter les restrictions CSS */}
      {showQuizModal && typeof document !== 'undefined' && createPortal(
        <QuizConfigModal
          isOpen={showQuizModal}
          formationId={formation.id}
          existingQuiz={quiz ? {
            id: quiz.id,
            formationId: quiz.formationId,
            title: quiz.title,
            description: quiz.description,
            passingScore: quiz.passingScore,
            timeLimit: quiz.timeLimit,
            isActive: quiz.isActive,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
            questions: quiz.questions
          } : undefined}
          onClose={() => setShowQuizModal(false)}
          onSave={handleSaveQuiz}
        />,
        document.body
      )}

      {/* Modal de récapitulatif du quiz */}
      {showQuizRecap && quiz && lastAttempt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10002] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-brand-blue text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Récapitulatif du quiz</h2>
                  <p className="text-purple-100">{quiz.title}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span>Score: {lastAttempt.score}%</span>
                    <span>•</span>
                    <span>{lastAttempt.isPassed ? '✓ Réussi' : '✗ Échoué'}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowQuizRecap(false);
                    setSelectedQuestionIndex(null);
                  }}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedQuestionIndex === null ? (
                <>
                  {/* Grille de questions */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions</h3>
                    <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 gap-2">
                      {quiz.questions.map((question, index) => {
                        // answers peut être soit une string (JSON) soit déjà un objet
                        let userAnswers: Record<string, any> = {};
                        if (lastAttempt.answers) {
                          if (typeof lastAttempt.answers === 'string') {
                            try {
                              userAnswers = JSON.parse(lastAttempt.answers);
                            } catch (e) {
                              userAnswers = {};
                            }
                          } else {
                            userAnswers = lastAttempt.answers as Record<string, any>;
                          }
                        }
                        const userAnswer = userAnswers[question.id];
                        
                        // Vérifier si la réponse est correcte
                        let isCorrect: boolean = false;
                        if (question.type === 'fill_in_blank') {
                          // Phrases à trous : comparer les réponses
                          const expectedAnswers = question.answers.map(a => a.answer.toLowerCase().trim());
                          const userAnswersArray = Array.isArray(userAnswer) 
                            ? userAnswer.map((ans: string) => ans.toLowerCase().trim())
                            : [];
                          isCorrect = expectedAnswers.length > 0 &&
                            expectedAnswers.length === userAnswersArray.length &&
                            expectedAnswers.every((expected, idx) => expected === userAnswersArray[idx]);
                        } else if (question.type === 'multiple_choice') {
                          const correctAnswerIds = question.answers.filter(a => a.isCorrect).map(a => a.id);
                          const userAnswerIds = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                          isCorrect = correctAnswerIds.length > 0 && 
                            correctAnswerIds.every(id => userAnswerIds.includes(id)) &&
                            userAnswerIds.length === correctAnswerIds.length;
                        } else if (question.type === 'true_false') {
                          const correctAnswer = question.answers.find(a => a.isCorrect);
                          isCorrect = Boolean(correctAnswer && userAnswer === correctAnswer.id);
                        }

                        return (
                          <button
                            key={question.id}
                            onClick={() => setSelectedQuestionIndex(index)}
                            className={`w-10 h-10 flex items-center justify-center rounded-md font-semibold text-sm transition-all hover:scale-110 ${
                              isCorrect
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Légende */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-gray-700">Réponse correcte</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-gray-700">Réponse incorrecte</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Détail de la question */}
                  <button
                    onClick={() => setSelectedQuestionIndex(null)}
                    className="mb-4 flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Retour à la grille
                  </button>

                  {(() => {
                    const question = quiz.questions[selectedQuestionIndex];
                    // answers peut être soit une string (JSON) soit déjà un objet
                    let userAnswers: Record<string, any> = {};
                    if (lastAttempt.answers) {
                      if (typeof lastAttempt.answers === 'string') {
                        try {
                          userAnswers = JSON.parse(lastAttempt.answers);
                        } catch (e) {
                          userAnswers = {};
                        }
                      } else {
                        userAnswers = lastAttempt.answers as Record<string, any>;
                      }
                    }
                    const userAnswer = question.id ? userAnswers[question.id] : undefined;
                    
                    // Vérifier si la réponse est correcte
                    let isCorrect: boolean = false;
                    if (question.type === 'fill_in_blank') {
                      // Phrases à trous : comparer les réponses
                      const expectedAnswers = question.answers.map(a => a.answer.toLowerCase().trim());
                      const userAnswersArray = Array.isArray(userAnswer) 
                        ? userAnswer.map((ans: string) => ans.toLowerCase().trim())
                        : [];
                      isCorrect = expectedAnswers.length > 0 &&
                        expectedAnswers.length === userAnswersArray.length &&
                        expectedAnswers.every((expected, idx) => expected === userAnswersArray[idx]);
                    } else if (question.type === 'multiple_choice') {
                      const correctAnswerIds = question.answers.filter(a => a.isCorrect).map(a => a.id);
                      const userAnswerIds = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                      isCorrect = correctAnswerIds.length > 0 && 
                        correctAnswerIds.every(id => userAnswerIds.includes(id)) &&
                        userAnswerIds.length === correctAnswerIds.length;
                    } else if (question.type === 'true_false') {
                      const correctAnswer = question.answers.find(a => a.isCorrect);
                      isCorrect = Boolean(correctAnswer && userAnswer === correctAnswer.id);
                    }

                    return (
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              Question {selectedQuestionIndex + 1}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isCorrect 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isCorrect ? '✓ Correcte' : '✗ Incorrecte'}
                            </span>
                          </div>
                          <p className="text-lg text-gray-700">{question.question}</p>
                        </div>

                        <div className="space-y-4">
                          {question.type === 'fill_in_blank' ? (
                            // Affichage spécial pour phrases à trous
                            <>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Votre phrase complétée :</h4>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  {(() => {
                                    const parts = question.question.split(/(\{[^}]+)\}/g);
                                    const userAnswersArray = Array.isArray(userAnswer) ? userAnswer : [];
                                    let blankIdx = 0;
                                    
                                    return (
                                      <p className="text-gray-900">
                                        {parts.map((part, idx) => {
                                          if (part.match(/^\{[^}]+$/)) {
                                            const answer = userAnswersArray[blankIdx] || '____';
                                            blankIdx++;
                                            return (
                                              <span key={idx} className="font-medium text-blue-700 underline">
                                                {answer}
                                              </span>
                                            );
                                          }
                                          return <span key={idx}>{part}</span>;
                                        })}
                                      </p>
                                    );
                                  })()}
                                </div>
                              </div>
                              
                              {!isCorrect && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Phrase correcte :</h4>
                                  <div className="bg-green-50 p-4 rounded-lg">
                                    {(() => {
                                      const parts = question.question.split(/(\{[^}]+)\}/g);
                                      const correctAnswers = question.answers.map(a => a.answer);
                                      let blankIdx = 0;
                                      
                                      return (
                                        <p className="text-gray-900">
                                          {parts.map((part, idx) => {
                                            if (part.match(/^\{[^}]+$/)) {
                                              const answer = correctAnswers[blankIdx] || '';
                                              blankIdx++;
                                              return (
                                                <span key={idx} className="font-medium text-green-700 underline">
                                                  {answer}
                                                </span>
                                              );
                                            }
                                            return <span key={idx}>{part}</span>;
                                          })}
                                        </p>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            // Affichage standard pour choix multiples, vrai/faux, etc.
                            <>
                              {/* Vos réponses */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Vos réponses :</h4>
                                <div className="space-y-2">
                                  {question.answers.map((answer) => {
                                    const userAnswerIds = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                                    const isSelected = userAnswerIds.includes(answer.id);
                                    
                                    return (
                                      <div
                                        key={answer.id}
                                        className={`p-3 rounded-lg border-2 ${
                                          isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className={isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}>
                                            {answer.answer}
                                          </span>
                                          {isSelected && (
                                            <span className="text-blue-600 font-medium">✓ Sélectionnée</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Bonnes réponses */}
                              {!isCorrect && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Bonne(s) réponse(s) :</h4>
                                  <div className="space-y-2">
                                    {question.answers
                                      .filter(a => a.isCorrect)
                                      .map((answer) => (
                                        <div
                                          key={answer.id}
                                          className="p-3 rounded-lg border-2 border-green-500 bg-green-50"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900">{answer.answer}</span>
                                            <span className="text-green-600 font-medium">✓ Correcte</span>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
