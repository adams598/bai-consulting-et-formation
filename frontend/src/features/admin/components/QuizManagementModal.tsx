import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Eye, BarChart3 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/use-toast';

interface QuizQuestion {
  id?: string;
  question: string;
  type: string;
  points: number;
  order: number;
  answers: QuizAnswer[];
}

interface QuizAnswer {
  id?: string;
  answer: string;
  isCorrect: boolean;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number | null;
  isActive: boolean;
  questions: QuizQuestion[];
}

interface QuizManagementModalProps {
  formationId: string;
  formationTitle: string;
  existingQuiz?: Quiz | null;
  onClose: () => void;
  onSave: (quiz: Quiz) => void;
}

const QuizManagementModal: React.FC<QuizManagementModalProps> = ({
  formationId,
  formationTitle,
  existingQuiz,
  onClose,
  onSave,
}) => {
  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    title: existingQuiz?.title || `Quiz - ${formationTitle}`,
    description: existingQuiz?.description || '',
    passingScore: existingQuiz?.passingScore || 80,
    timeLimit: existingQuiz?.timeLimit || null,
    isActive: existingQuiz?.isActive ?? true,
    questions: existingQuiz?.questions || [],
  });

  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: '',
      type: 'multiple_choice',
      points: 1,
      order: quiz.questions?.length || 0,
      answers: [
        { answer: '', isCorrect: false, order: 0 },
        { answer: '', isCorrect: false, order: 1 },
      ],
    };
    setEditingQuestion(newQuestion);
    setShowQuestionForm(true);
  };

  const editQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const saveQuestion = (questionData: QuizQuestion) => {
    if (editingQuestion) {
      const updatedQuestions = quiz.questions?.map(q => 
        q === editingQuestion ? questionData : q
      ) || [];
      setQuiz({ ...quiz, questions: updatedQuestions });
    } else {
      setQuiz({
        ...quiz,
        questions: [...(quiz.questions || []), questionData],
      });
    }
    setShowQuestionForm(false);
    setEditingQuestion(null);
  };

  const deleteQuestion = (questionToDelete: QuizQuestion) => {
    const updatedQuestions = quiz.questions?.filter(q => q !== questionToDelete) || [];
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleSave = async () => {
    if (!quiz.title || !quiz.questions?.length) {
      toast({
        title: "Erreur",
        description: "Le titre et au moins une question sont requis",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(quiz as Quiz);
      toast({
        title: "Succès",
        description: "Quiz sauvegardé avec succès",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le quiz",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {existingQuiz ? 'Modifier le Quiz' : 'Créer un Quiz'}
              </h2>
              <p className="text-blue-100 mt-1">{formationTitle}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-blue-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Quiz Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Paramètres du Quiz</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du Quiz
                </label>
                <input
                  type="text"
                  value={quiz.title || ''}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre du quiz"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score de Réussite (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quiz.passingScore || 80}
                  onChange={(e) => setQuiz({ ...quiz, passingScore: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Temps (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={quiz.timeLimit || ''}
                  onChange={(e) => setQuiz({ ...quiz, timeLimit: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Aucune limite"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={quiz.isActive || false}
                  onChange={(e) => setQuiz({ ...quiz, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Quiz actif
                </label>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={quiz.description || ''}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description du quiz"
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Questions ({quiz.questions?.length || 0})
              </h3>
              <Button onClick={addQuestion} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une Question
              </Button>
            </div>

            {quiz.questions?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune question ajoutée</p>
                <p className="text-sm">Cliquez sur "Ajouter une Question" pour commencer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quiz.questions?.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          Question {index + 1}: {question.question}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Type: {question.type === 'multiple_choice' ? 'Choix multiples' : 'Vrai/Faux'} | 
                          Points: {question.points}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editQuestion(question)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteQuestion(question)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {question.answers.map((answer, answerIndex) => (
                        <div key={answerIndex} className="flex items-center text-sm">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            answer.isCorrect ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          {answer.answer}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizManagementModal;













