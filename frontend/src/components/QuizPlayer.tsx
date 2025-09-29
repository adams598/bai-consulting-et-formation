import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  points: number;
  answers: QuizAnswer[];
}

interface QuizAnswer {
  id: string;
  answer: string;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number | null;
  questions: QuizQuestion[];
}

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  onClose: () => void;
}

interface QuizResult {
  score: number;
  isPassed: boolean;
  totalScore: number;
  userScore: number;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onComplete, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Initialiser le timer si nécessaire
  useEffect(() => {
    if (quiz.timeLimit && !startTime) {
      setTimeLeft(quiz.timeLimit * 60); // Convertir en secondes
      setStartTime(new Date());
    }
  }, [quiz.timeLimit, startTime]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

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
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answerId: string, isMultiple: boolean = false) => {
    setAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] as string[] : [];
        const newAnswers = currentAnswers.includes(answerId)
          ? currentAnswers.filter(id => id !== answerId)
          : [...currentAnswers, answerId];
        return { ...prev, [questionId]: newAnswers };
      } else {
        return { ...prev, [questionId]: answerId };
      }
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    
    try {
      const timeSpent = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : null;
      
      // Calculer le score côté client pour l'affichage immédiat
      let totalScore = 0;
      let userScore = 0;

      quiz.questions.forEach(question => {
        totalScore += question.points;
        const userAnswer = answers[question.id];
        
        if (userAnswer) {
          // Pour les questions à choix multiples
          if (question.type === "multiple_choice") {
            const correctAnswers = question.answers.filter(a => a.isCorrect);
            const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
            
            const allCorrect = correctAnswers.every(correct => 
              userAnswers.includes(correct.id)
            ) && userAnswers.length === correctAnswers.length;
            
            if (allCorrect) {
              userScore += question.points;
            }
          }
          // Pour les questions vrai/faux
          else if (question.type === "true_false") {
            const correctAnswer = question.answers.find(a => a.isCorrect);
            if (correctAnswer && userAnswer === correctAnswer.id) {
              userScore += question.points;
            }
          }
        }
      });

      const scorePercentage = totalScore > 0 ? Math.round((userScore / totalScore) * 100) : 0;
      const isPassed = scorePercentage >= quiz.passingScore;

      const result: QuizResult = {
        score: scorePercentage,
        isPassed,
        totalScore,
        userScore,
      };

      onComplete(result);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission du quiz",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{quiz.title}</h2>
            {timeLeft !== null && (
              <div className="flex items-center space-x-2 bg-blue-800 px-3 py-1 rounded-lg">
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
          
          {quiz.description && (
            <p className="text-blue-100 mb-4">{quiz.description}</p>
          )}
          
          {/* Progress bar */}
          <div className="w-full bg-blue-800 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-blue-100">
            <span>Question {currentQuestionIndex + 1} sur {quiz.questions.length}</span>
            <span>Score minimum: {quiz.passingScore}%</span>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h3>
            
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => {
                const isSelected = currentQuestion.type === "multiple_choice" 
                  ? Array.isArray(answers[currentQuestion.id]) && (answers[currentQuestion.id] as string[]).includes(answer.id)
                  : answers[currentQuestion.id] === answer.id;

                return (
                  <label
                    key={answer.id}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type={currentQuestion.type === "multiple_choice" ? "checkbox" : "radio"}
                      name={`question-${currentQuestion.id}`}
                      value={answer.id}
                      checked={isSelected}
                      onChange={() => handleAnswerChange(currentQuestion.id, answer.id, currentQuestion.type === "multiple_choice")}
                      className="mr-3 w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900">{answer.answer}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Précédent
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              
              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Soumission..." : "Terminer le quiz"}
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={!answers[currentQuestion.id]}
                >
                  Suivant
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPlayer;









