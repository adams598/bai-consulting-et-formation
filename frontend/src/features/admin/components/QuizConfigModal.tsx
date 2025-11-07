import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { Quiz, QuizQuestion, QuizAnswer } from '../types';
import QuizPreviewModal from './QuizPreviewModal';
import ConfirmationModal from './ConfirmationModal';
import { useConfirmation } from '../../../hooks/useConfirmation';

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
  const [showPreview, setShowPreview] = useState(false);
  
  // Hook de confirmation
  const confirmation = useConfirmation();

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
        isRequired: true,
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
      isRequired: true,
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
    setQuestions(prev => prev.map((q, i) => {
      if (i === index) {
        const updatedQuestion = { ...q, [field]: value };
        
        // Si on change le type de question, adapter les réponses
        if (field === 'type') {
          if (value === 'true_false') {
            updatedQuestion.answers = [
              { answer: 'Vrai', isCorrect: true, order: 1 },
              { answer: 'Faux', isCorrect: false, order: 2 }
            ];
          } else if (value === 'text') {
            updatedQuestion.answers = [
              { answer: 'Réponse libre', isCorrect: true, order: 1 }
            ];
          } else if (value === 'fill_in_blank') {
            // Pour les phrases à trous, initialiser avec une phrase vide
            updatedQuestion.answers = [];
          } else if (value === 'multiple_choice' && (!q.answers || q.answers.length < 2)) {
            updatedQuestion.answers = [
              { answer: '', isCorrect: false, order: 1 },
              { answer: '', isCorrect: false, order: 2 }
            ];
          }
        }
        
        return updatedQuestion;
      }
      return q;
    }));
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

  const setCorrectAnswer = (questionIndex: number, answerIndex: number, isMultipleChoice: boolean = false) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        if (isMultipleChoice) {
          // Pour choix multiples : toggle (permet plusieurs réponses correctes)
          return {
            ...q,
            answers: q.answers?.map((a, ai) => ({
              ...a,
              isCorrect: ai === answerIndex ? !a.isCorrect : a.isCorrect
            })) || []
          };
        } else {
          // Pour Vrai/Faux : une seule réponse possible (radio)
          return {
            ...q,
            answers: q.answers?.map((a, ai) => ({
              ...a,
              isCorrect: ai === answerIndex
            })) || []
          };
        }
      }
      return q;
    }));
  };

  // Fonction pour compter le nombre de réponses correctes
  const getCorrectAnswersCount = (question: Partial<QuizQuestion>) => {
    return question.answers?.filter(a => a.isCorrect).length || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!quizData.title?.trim()) {
      confirmation.showConfirmation({
        title: 'Titre requis',
        message: 'Le titre du quiz est requis pour continuer.',
        confirmText: 'Compris',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    if (questions.length === 0) {
      confirmation.showConfirmation({
        title: 'Questions requises',
        message: 'Au moins une question est requise pour créer le quiz.',
        confirmText: 'Compris',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    // Vérifier que chaque question a au moins 2 réponses et une réponse correcte
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question?.trim()) {
        confirmation.showConfirmation({
          title: 'Question incomplète',
          message: `Question ${i + 1}: Le texte de la question est requis.`,
          confirmText: 'Compris',
          type: 'warning',
          onConfirm: () => {}
        });
        return;
      }
      
      if (!q.answers || q.answers.length < 2) {
        confirmation.showConfirmation({
          title: 'Réponses insuffisantes',
          message: `Question ${i + 1}: Au moins 2 réponses sont requises.`,
          confirmText: 'Compris',
          type: 'warning',
          onConfirm: () => {}
        });
        return;
      }

      const hasCorrectAnswer = q.answers.some(a => a.isCorrect);
      if (!hasCorrectAnswer) {
        confirmation.showConfirmation({
          title: 'Aucune réponse correcte',
          message: `Question ${i + 1}: Au moins une réponse correcte doit être sélectionnée.`,
          confirmText: 'Compris',
          type: 'warning',
          onConfirm: () => {}
        });
        return;
      }

      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].answer?.trim()) {
          confirmation.showConfirmation({
            title: 'Réponse incomplète',
            message: `Question ${i + 1}, Réponse ${j + 1}: Le texte de la réponse est requis.`,
            confirmText: 'Compris',
            type: 'warning',
            onConfirm: () => {}
          });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10002]">
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question *
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Texte de la question"
                      rows={2}
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
                      max="10"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`required-${qIndex}`}
                        checked={question.isRequired !== false}
                        onChange={(e) => updateQuestion(qIndex, 'isRequired', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`required-${qIndex}`} className="text-sm text-gray-700">
                        Obligatoire
                      </label>
                    </div>
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
                    <option value="fill_in_blank">Phrases à trous</option>
                  </select>
                </div>

                {/* Interface spéciale pour phrases à trous */}
                {question.type === 'fill_in_blank' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phrase avec trous *
                      </label>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Comment créer une phrase à trous :</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Utilisez des accolades pour marquer les trous : <code className="bg-blue-100 px-1 rounded">{"Le {chat} dort sur le {canapé}"}</code></li>
                              <li>Les mots entre accolades seront remplacés par des champs de saisie</li>
                              <li>Les réponses attendues sont automatiquement extraites</li>
                              <li>La correction ignore les majuscules et les espaces superflus</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <textarea
                        value={question.question}
                        onChange={(e) => {
                          updateQuestion(qIndex, 'question', e.target.value);
                          // Extraire automatiquement les réponses des trous
                          const matches = e.target.value.match(/\{([^}]+)\}/g);
                          if (matches) {
                            const blanks = matches.map((match, idx) => ({
                              answer: match.replace(/[{}]/g, ''),
                              isCorrect: true,
                              order: idx + 1
                            }));
                            setQuestions(prev => prev.map((q, i) => 
                              i === qIndex ? { ...q, answers: blanks } : q
                            ));
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Le {chat} dort sur le {canapé}"
                        rows={3}
                        required
                      />
                    </div>
                    
                    {/* Aperçu des trous détectés */}
                    {question.answers && question.answers.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          {question.answers.length} trou{question.answers.length > 1 ? 's' : ''} détecté{question.answers.length > 1 ? 's' : ''} :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {question.answers.map((answer, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              {idx + 1}. {answer.answer}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Réponses */}
                {question.type !== 'text' && question.type !== 'fill_in_blank' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        {question.type === 'true_false' ? 'Réponse correcte *' : 'Réponses *'}
                      </label>
                      {question.type === 'multiple_choice' && (
                        <button
                          type="button"
                          onClick={() => addAnswer(qIndex)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                          disabled={question.answers && question.answers.length >= 6}
                        >
                          + Ajouter réponse
                        </button>
                      )}
                    </div>

                    {question.type === 'true_false' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.answers?.[0]?.isCorrect}
                            onChange={() => setCorrectAnswer(qIndex, 0, false)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-green-600">Vrai</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.answers?.[1]?.isCorrect}
                            onChange={() => setCorrectAnswer(qIndex, 1, false)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-red-600">Faux</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Indicateur du nombre de réponses attendues */}
                        {question.type === 'multiple_choice' && (
                          <div className="mb-3">
                            {(() => {
                              const correctCount = getCorrectAnswersCount(question);
                              if (correctCount === 0) {
                                return (
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Aucune réponse correcte sélectionnée</span>
                                  </div>
                                );
                              } else if (correctCount === 1) {
                                return (
                                  <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Une seule réponse attendue</span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center space-x-2 text-sm text-purple-600 font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Plusieurs réponses sont attendues ({correctCount} réponse{correctCount > 1 ? 's' : ''})</span>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                        
                        {question.answers?.map((answer, aIndex) => (
                          <div key={aIndex} className="flex items-center space-x-3">
                            <input
                              type={question.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                              name={question.type === 'multiple_choice' ? `correct-${qIndex}-${aIndex}` : `correct-${qIndex}`}
                              checked={answer.isCorrect}
                              onChange={() => setCorrectAnswer(qIndex, aIndex, question.type === 'multiple_choice')}
                              className={question.type === 'multiple_choice' ? 'rounded border-gray-300 text-blue-600 focus:ring-blue-500' : 'text-blue-600 focus:ring-blue-500'}
                              title={question.type === 'multiple_choice' ? 'Cocher/décocher comme réponse correcte' : 'Marquer comme réponse correcte'}
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
                              title="Supprimer cette réponse"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Instructions pour question texte libre */}
                {question.type === 'text' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Question à réponse libre</p>
                        <p className="mt-1">Cette question sera évaluée manuellement par un formateur.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Résumé du quiz */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Résumé du quiz</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Questions :</span>
                <span className="ml-1 font-medium">{questions.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Points total :</span>
                <span className="ml-1 font-medium">
                  {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Seuil de réussite :</span>
                <span className="ml-1 font-medium">{quizData.passingScore}%</span>
              </div>
              <div>
                <span className="text-gray-500">Limite de temps :</span>
                <span className="ml-1 font-medium">
                  {quizData.timeLimit ? `${quizData.timeLimit} min` : 'Aucune'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
              disabled={questions.length === 0}
            >
              <Eye className="h-4 w-4" />
              Prévisualiser
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || questions.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder le Quiz'}
              </button>
            </div>
          </div>
        </form>

        {/* Modal de prévisualisation */}
        <QuizPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          quizData={quizData}
          questions={questions}
        />
        
        {/* Modal de confirmation */}
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          onClose={confirmation.hideConfirmation}
          onConfirm={confirmation.handleConfirm}
          title={confirmation.options?.title || ''}
          message={confirmation.options?.message || ''}
          confirmText={confirmation.options?.confirmText}
          cancelText={confirmation.options?.cancelText}
          type={confirmation.options?.type}
          isLoading={confirmation.isLoading}
        />
      </div>
    </div>
  );
};

export default QuizConfigModal;
