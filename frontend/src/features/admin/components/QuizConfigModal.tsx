import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Quiz, QuizQuestion, QuizAnswer } from '../types';

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quizData: Partial<Quiz>) => void;
  formationId: string;
  existingQuiz?: Quiz | null;
}

const QuizConfigModal: React.FC<QuizConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formationId,
  existingQuiz
}) => {
  const [quizData, setQuizData] = useState<Partial<Quiz>>({
    title: '',
    description: '',
    passingScore: 80,
    timeLimit: undefined,
    isActive: true
  });

  const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingQuiz) {
      setQuizData({
        title: existingQuiz.title,
        description: existingQuiz.description,
        passingScore: existingQuiz.passingScore,
        timeLimit: existingQuiz.timeLimit,
        isActive: existingQuiz.isActive
      });
      
      if (existingQuiz.questions) {
        setQuestions(existingQuiz.questions.map(q => ({
          ...q,
          answers: q.answers || []
        })));
      }
    } else {
      // Nouveau quiz - ajouter une première question
      setQuestions([{
        question: '',
        type: 'multiple_choice',
        order: 1,
        points: 1,
        answers: [
          { answer: '', isCorrect: false, order: 1 },
          { answer: '', isCorrect: false, order: 2 }
        ]
      }]);
    }
  }, [existingQuiz]);

  const handleQuizDataChange = (field: keyof Quiz, value: any) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    const newQuestion: Partial<QuizQuestion> = {
      question: '',
      type: 'multiple_choice',
      order: questions.length + 1,
      points: 1,
      answers: [
        { answer: '', isCorrect: false, order: 1 },
        { answer: '', isCorrect: false, order: 2 }
      ]
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    console.log('removeQuestion appelé avec index:', index);
    console.log('Questions avant suppression:', questions);
    setQuestions(prev => {
      const newQuestions = prev.filter((_, i) => i !== index);
      console.log('Questions après suppression:', newQuestions);
      return newQuestions;
    });
    // Réorganiser l'ordre
    setQuestions(prev => prev.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const addAnswer = (questionIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        const newOrder = (q.answers?.length || 0) + 1;
        return {
          ...q,
          answers: [...(q.answers || []), { answer: '', isCorrect: false, order: newOrder }]
        };
      }
      return q;
    }));
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    console.log('removeAnswer appelé avec questionIndex:', questionIndex, 'answerIndex:', answerIndex);
    console.log('Questions avant suppression de réponse:', questions);
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        const newAnswers = q.answers?.filter((_, ai) => ai !== answerIndex) || [];
        console.log('Nouvelles réponses pour question', i, ':', newAnswers);
        // Réorganiser l'ordre des réponses
        return {
          ...q,
          answers: newAnswers.map((a, ai) => ({ ...a, order: ai + 1 }))
        };
      }
      return q;
    }));
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, field: keyof QuizAnswer, value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        return {
          ...q,
          answers: q.answers?.map((a, ai) => 
            ai === answerIndex ? { ...a, [field]: value } : a
          ) || []
        };
      }
      return q;
    }));
  };

  const setCorrectAnswer = (questionIndex: number, answerIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        return {
          ...q,
          answers: q.answers?.map((a, ai) => ({
            ...a,
            isCorrect: ai === answerIndex
          })) || []
        };
      }
      return q;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!quizData.title?.trim()) {
      alert('Le titre du quiz est requis');
      return;
    }

    if (questions.length === 0) {
      alert('Au moins une question est requise');
      return;
    }

    // Vérifier que chaque question a au moins 2 réponses et une réponse correcte
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question?.trim()) {
        alert(`Question ${i + 1}: Le texte de la question est requis`);
        return;
      }
      
      if (!q.answers || q.answers.length < 2) {
        alert(`Question ${i + 1}: Au moins 2 réponses sont requises`);
        return;
      }

      const hasCorrectAnswer = q.answers.some(a => a.isCorrect);
      if (!hasCorrectAnswer) {
        alert(`Question ${i + 1}: Une réponse correcte doit être sélectionnée`);
        return;
      }

      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].answer?.trim()) {
          alert(`Question ${i + 1}, Réponse ${j + 1}: Le texte de la réponse est requis`);
          return;
        }
      }
    }

    try {
      setIsLoading(true);
      
      const quizToSave = {
        ...quizData,
        formationId,
        questions: questions.map((q, index) => ({
          ...q,
          order: index + 1,
          answers: q.answers?.map((a, aIndex) => ({
            ...a,
            order: aIndex + 1
          })) || []
        }))
      };

      await onSave(quizToSave);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {existingQuiz ? 'Modifier le Quiz' : 'Configurer le Quiz'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations générales du quiz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du quiz *
              </label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => handleQuizDataChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Titre du quiz"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score de réussite (%) *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quizData.passingScore}
                onChange={(e) => handleQuizDataChange('passingScore', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={quizData.description}
              onChange={(e) => handleQuizDataChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Description du quiz (optionnel)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de temps (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={quizData.timeLimit || ''}
                onChange={(e) => handleQuizDataChange('timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Pas de limite"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={quizData.isActive}
                onChange={(e) => handleQuizDataChange('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Quiz actif
              </label>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter Question
              </button>
            </div>

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-md font-medium text-gray-900">
                    Question {qIndex + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-700 p-1"
                    disabled={questions.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question *
                    </label>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Texte de la question"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de question
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="multiple_choice">Choix multiple</option>
                    <option value="true_false">Vrai/Faux</option>
                    <option value="text">Texte libre</option>
                  </select>
                </div>

                {/* Réponses */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Réponses *
                    </label>
                    <button
                      type="button"
                      onClick={() => addAnswer(qIndex)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Ajouter réponse
                    </button>
                  </div>

                  {question.answers?.map((answer, aIndex) => (
                    <div key={aIndex} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={answer.isCorrect}
                        onChange={() => setCorrectAnswer(qIndex, aIndex)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={answer.answer}
                        onChange={(e) => updateAnswer(qIndex, aIndex, 'answer', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Réponse ${aIndex + 1}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeAnswer(qIndex, aIndex)}
                        className="text-red-600 hover:text-red-700 p-1"
                        disabled={question.answers!.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder le Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizConfigModal;
