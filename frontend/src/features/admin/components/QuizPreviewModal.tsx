import React, { useState } from 'react';
import { X, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Quiz, QuizQuestion } from '../types';

interface QuizPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizData: Partial<Quiz>;
  questions: Partial<QuizQuestion>[];
}

const QuizPreviewModal: React.FC<QuizPreviewModalProps> = ({
  isOpen,
  onClose,
  quizData,
  questions
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>({});
  const [showResults, setShowResults] = useState(false);

  if (!isOpen) return null;

  const handleAnswerSelect = (questionIndex: number, answerIndex: number | string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((question, qIndex) => {
      const selectedAnswer = selectedAnswers[qIndex];
      const points = question.points || 1;
      totalPoints += points;

      if (question.type === 'text') {
        // Pour les questions texte libre, on considère qu'elles sont correctes (évaluation manuelle)
        earnedPoints += points;
        correctAnswers++;
      } else if (question.answers && typeof selectedAnswer === 'number') {
        const answer = question.answers[selectedAnswer];
        if (answer?.isCorrect) {
          earnedPoints += points;
          correctAnswers++;
        }
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= (quizData.passingScore || 80);

    return {
      correctAnswers,
      totalQuestions: questions.length,
      earnedPoints,
      totalPoints,
      percentage,
      passed
    };
  };

  const results = showResults ? calculateScore() : null;

  const resetPreview = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Prévisualisation : {quizData.title}
            </h2>
            {quizData.timeLimit && (
              <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                <Clock className="h-4 w-4 mr-1" />
                {quizData.timeLimit} min
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {quizData.description && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">{quizData.description}</p>
            </div>
          )}

          {!showResults ? (
            <>
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Question {currentQuestion + 1} sur {questions.length}</span>
                  <span>Seuil de réussite : {quizData.passingScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question actuelle */}
              {questions[currentQuestion] && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-medium text-gray-900 flex-1">
                      {questions[currentQuestion].question}
                    </h3>
                    <div className="ml-4 flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {questions[currentQuestion].points || 1} point(s)
                      </span>
                      {questions[currentQuestion].isRequired !== false && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Obligatoire
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {questions[currentQuestion].type === 'text' ? (
                      <textarea
                        value={selectedAnswers[currentQuestion] || ''}
                        onChange={(e) => handleAnswerSelect(currentQuestion, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Tapez votre réponse ici..."
                      />
                    ) : (
                      questions[currentQuestion].answers?.map((answer, aIndex) => (
                        <label
                          key={aIndex}
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion}`}
                            checked={selectedAnswers[currentQuestion] === aIndex}
                            onChange={() => handleAnswerSelect(currentQuestion, aIndex)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900">{answer.answer}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>

                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Suivant
                  </button>
                ) : (
                  <button
                    onClick={() => setShowResults(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Terminer le quiz
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Résultats */
            <div className="space-y-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  results!.passed ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {results!.passed ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {results!.passed ? 'Quiz réussi !' : 'Quiz échoué'}
                </h3>
                <p className="text-gray-600">
                  Vous avez obtenu {results!.percentage}% ({results!.earnedPoints}/{results!.totalPoints} points)
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{results!.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Bonnes réponses</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{results!.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{results!.earnedPoints}</div>
                  <div className="text-sm text-gray-600">Points obtenus</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{results!.percentage}%</div>
                  <div className="text-sm text-gray-600">Score final</div>
                </div>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={resetPreview}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Recommencer
                </button>
                <button
                  onClick={onClose}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPreviewModal;
