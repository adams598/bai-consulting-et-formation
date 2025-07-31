import React, { useState } from 'react';
import { Question } from '../types';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface QuizProps {
  questions: Question[];
  onComplete: (score: number, passed: boolean) => void;
  timeLimit?: number;
  passingScore: number;
}

export default function Quiz({ questions, onComplete, timeLimit, passingScore }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | string[])[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : undefined);

  // Gestion du timer
  React.useEffect(() => {
    if (timeLeft === undefined) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev! - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerSelect = (answer: string | string[]) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const score = questions.reduce((total, question, index) => {
      const selectedAnswer = selectedAnswers[index];
      const correctAnswer = question.correctAnswer;

      if (Array.isArray(correctAnswer)) {
        // Pour les questions à choix multiples
        return total + (
          Array.isArray(selectedAnswer) &&
          selectedAnswer.length === correctAnswer.length &&
          selectedAnswer.every(answer => correctAnswer.includes(answer))
            ? question.points
            : 0
        );
      } else {
        // Pour les questions à choix unique
        return total + (selectedAnswer === correctAnswer ? question.points : 0);
      }
    }, 0);

    const totalPoints = questions.reduce((total, question) => total + question.points, 0);
    const percentage = (score / totalPoints) * 100;
    const passed = percentage >= passingScore;

    setShowResults(true);
    onComplete(score, passed);
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (showResults) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Résultats du quiz</h2>
        <div className="space-y-6">
          {questions.map((question, index) => {
            const selectedAnswer = selectedAnswers[index];
            const isCorrect = Array.isArray(question.correctAnswer)
              ? Array.isArray(selectedAnswer) &&
                selectedAnswer.length === question.correctAnswer.length &&
                selectedAnswer.every(answer => question.correctAnswer.includes(answer))
              : selectedAnswer === question.correctAnswer;

            return (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 mb-2">{question.text}</p>
                    <div className="space-y-2">
                      {question.options?.map(option => (
                        <div
                          key={option}
                          className={`p-2 rounded ${
                            option === question.correctAnswer
                              ? 'bg-green-50 text-green-700'
                              : option === selectedAnswer
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-50'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Timer */}
      {timeLeft !== undefined && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-brand-blue" />
              <span className="text-gray-600">Temps restant</span>
            </div>
            <span className="font-medium text-gray-900">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-brand-blue h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / (timeLimit! * 60)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Question {currentQuestionIndex + 1} sur {questions.length}
        </h2>
        <p className="text-gray-900 mb-4">{currentQuestion.text}</p>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.map(option => (
            <label
              key={option}
              className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={option}
                checked={selectedAnswers[currentQuestionIndex] === option}
                onChange={() => handleAnswerSelect(option)}
                className="h-4 w-4 text-brand-blue"
              />
              <span className="ml-3 text-gray-900">{option}</span>
            </label>
          ))}

          {currentQuestion.type === 'true-false' && (
            <div className="space-y-3">
              {['Vrai', 'Faux'].map(option => (
                <label
                  key={option}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={selectedAnswers[currentQuestionIndex] === option}
                    onChange={() => handleAnswerSelect(option)}
                    className="h-4 w-4 text-brand-blue"
                  />
                  <span className="ml-3 text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'open-ended' && (
            <textarea
              value={selectedAnswers[currentQuestionIndex] as string || ''}
              onChange={(e) => handleAnswerSelect(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              rows={4}
              placeholder="Votre réponse..."
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Précédent
        </button>
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90"
          >
            Terminer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
} 