import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { Quiz, QuizQuestion, QuizAnswer } from '../types';
import QuizPreviewModal from './QuizPreviewModal';
import ConfirmationModal from './ConfirmationModal';
import { useConfirmation } from '../../../hooks/useConfirmation';

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quizData: Partial<Quiz>) => Promise<void>;  // <--- async
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
    questionTimeLimitSec: undefined,
    isActive: true,
    triggerType: 'END',
    triggerTime: undefined,
  });

  const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loadedQuizId, setLoadedQuizId] = useState<string | 'new' | null>(null);

  // Hook de confirmation
  const confirmation = useConfirmation();

  useEffect(() => {
    if (!isOpen) {
      setLoadedQuizId(null);
      return;
    }

    if (existingQuiz) {
      if (loadedQuizId === existingQuiz.id) return;
      setLoadedQuizId(existingQuiz.id);

      setQuizData({
        title: existingQuiz.title,
        description: existingQuiz.description,
        passingScore: existingQuiz.passingScore,
        timeLimit: existingQuiz.timeLimit,
        questionTimeLimitSec: existingQuiz.questionTimeLimitSec,
        isActive: existingQuiz.isActive,
        triggerType: existingQuiz.triggerType || 'END',
        triggerTime: existingQuiz.triggerTime,
      });

      setQuestions((existingQuiz.questions || []).map(q => ({
        ...q,
        answers: q.answers || [],
        triggerTime: q.triggerTime ?? 0,
      })));

      return;
    }

    if (loadedQuizId === 'new') return;
    setLoadedQuizId('new');

    setQuestions([{
      question: '',
      type: 'single_choice',
      answers: [],
      order: 1,
      triggerTime: 0,
      id: '',
      questionId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);
  }, [isOpen, existingQuiz, loadedQuizId]);

  const handleQuizDataChange = (field: keyof Quiz, value: any) => {
    setQuizData(prev => {
      const newData = { ...prev, [field]: value };

      // Si on passe en mode MID_VIDEO et que triggerTime est indéfini, on met 0 par défaut (0 min)
      if (field === 'triggerType' && value === 'MID_VIDEO' && prev.triggerTime === undefined) {
        newData.triggerTime = 0;
      }

      return newData;
    });
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: '',
        type: 'single_choice',
        answers: [],
        order: prev.length + 1,
        triggerTime: 0,
        id: '',
        questionId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Partial<QuizQuestion>,
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => {
      const newQuestions = prev.filter((_, i) => i !== index);
      return newQuestions.map((q, i) => ({ ...q, order: i + 1 }));
    });
  };

  const updateQuestion = (idx: number, field: keyof Partial<QuizQuestion>, value: any) => {
    const normalized = field === 'triggerTime' ? normalizeTriggerTime(value) : value;
    setQuestions(prev => prev.map((q, i) => (i === idx ? { ...q, [field]: normalized } : q)));
  };

  const validateQuiz = (): boolean => {
    if (!quizData.title?.trim()) {
      confirmation.showConfirmation({ title: 'Titre manquant', message: 'Le titre du quiz est requis.', confirmText: 'OK', type: 'warning', onConfirm: () => {} });
      return false;
    }

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (q.triggerTime == null || q.triggerTime < 0) {
        confirmation.showConfirmation({
          title: 'Moment manquant',
          message: `Question ${i + 1} : indiquez un moment >= 0.`,
          confirmText: 'OK',
          type: 'warning',
          onConfirm: () => {},
        });
        return false;
      }
    }

    return true;
  };

  const handleSaveQuiz = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateQuiz()) return;

    setIsLoading(true);
    try {
      const quizToSave = {
        ...quizData,
        formationId,
        questions: questions.map((q, index) => ({
          ...q,
          order: index + 1,
          triggerTime: normalizeTriggerTime(q.triggerTime) ?? 0,
          answers: q.answers?.map((a, aIndex) => ({ ...a, order: aIndex + 1 })) || [],
        })) as QuizQuestion[],
      };
      await onSave(quizToSave);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du quiz:', error);
      confirmation.showConfirmation({ title: 'Erreur', message: 'Une erreur est survenue.', confirmText: 'OK', type: 'danger', onConfirm: () => {} });
    } finally {
      setIsLoading(false);
    }
  };

  const getCorrectAnswersCount = (q: Partial<QuizQuestion> = {}): number => {
    return q.answers?.filter(a => a.isCorrect).length ?? 0;
  };

  const normalizeTriggerTime = (raw: number | string | undefined): number | undefined => {
    if (raw === undefined || raw === null || raw === '') return undefined;
    const str = String(raw).trim().replace(',', '.');
    const n = Number(str);
    if (Number.isNaN(n) || n < 0) return undefined;
    if (n < 1) return Math.round(n * 100); // 0.3 => 30
    return Math.round(n);
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

        <form onSubmit={handleSaveQuiz} className="p-6 space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temps max / question (secondes)
              </label>
              <input
                type="number"
                min="1"
                value={quizData.questionTimeLimitSec || ''}
                onChange={(e) => handleQuizDataChange('questionTimeLimitSec', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 15"
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

          {/* Déclenchement du quiz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moment du quiz
              </label>
              <select
                value={quizData.triggerType || 'END'}
                onChange={(e) => handleQuizDataChange('triggerType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="END">Fin de la vidéo</option>
                <option value="MID_VIDEO">En cours de vidéo</option>
              </select>
            </div>

            {quizData.triggerType === 'MID_VIDEO' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Déclencher à la minute
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quizData.triggerTime !== undefined ? ((quizData.triggerTime || 0) / 60) : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      handleQuizDataChange('triggerTime', undefined);
                      return;
                    }

                    const minutes = parseFloat(value);
                    if (isNaN(minutes) || minutes < 0) {
                      handleQuizDataChange('triggerTime', undefined);
                      return;
                    }

                    handleQuizDataChange('triggerTime', Math.round(minutes * 60));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 0.5 (pour 30 secondes)"
                />
                <p className="text-xs text-gray-500 mt-1">La vidéo sera mise en pause à ce moment.</p>
              </div>
            )}
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

            {questions.map((q, questionIndex) => (
              <div key={questionIndex} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-md font-medium text-gray-900">
                    Question {questionIndex + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-600 hover:text-red-700 p-1"
                    disabled={questions.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Texte de la question"
                      rows={2}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={q.points}
                      onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de question
                  </label>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(questionIndex, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="multiple_choice">Choix multiple</option>
                    <option value="true_false">Vrai/Faux</option>
                    <option value="text">Texte libre</option>
                    <option value="fill_in_blank">Phrases à trous</option>
                  </select>
                </div>

                {/* Interface spéciale pour phrases à trous */}
                {q.type === 'fill_in_blank' && (
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
                        value={q.question}
                        onChange={(e) => {
                          updateQuestion(questionIndex, 'question', e.target.value);
                          // Extraire automatiquement les réponses des trous
                          const matches = e.target.value.match(/\{([^}]+)\}/g);
                          if (matches) {
                            const blanks = matches.map((match, idx) => ({
                              answer: match.replace(/[{}]/g, ''),
                              isCorrect: true,
                              order: idx + 1,
                              id: '',
                              questionId: '',
                              createdAt: new Date(),
                              updatedAt: new Date()
                            }));
                            setQuestions(prev => prev.map((q, i) =>
                              i === questionIndex ? { ...q, answers: blanks } : q
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
                    {q.answers && q.answers.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          {q.answers.length} trou{q.answers.length > 1 ? 's' : ''} détecté{q.answers.length > 1 ? 's' : ''} :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {q.answers.map((answer, idx) => (
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
                {q.type !== 'text' && q.type !== 'fill_in_blank' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        {q.type === 'true_false' ? 'Réponse correcte *' : 'Réponses *'}
                      </label>
                      {q.type === 'multiple_choice' && (
                        <button
                          type="button"
                          onClick={() => addAnswer(questionIndex)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                          disabled={q.answers && q.answers.length >= 6}
                        >
                          + Ajouter réponse
                        </button>
                      )}
                    </div>

                    {q.type === 'true_false' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`correct-${questionIndex}`}
                            checked={q.answers?.[0]?.isCorrect}
                            onChange={() => setCorrectAnswer(questionIndex, 0, false)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-green-600">Vrai</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`correct-${questionIndex}`}
                            checked={q.answers?.[1]?.isCorrect}
                            onChange={() => setCorrectAnswer(questionIndex, 1, false)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-red-600">Faux</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Indicateur du nombre de réponses attendues */}
                        {q.type === 'multiple_choice' && (
                          <div className="mb-3">
                            {(() => {
                              const correctCount = getCorrectAnswersCount(q);
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

                        {q.answers?.map((answer, aIndex) => (
                          <div key={aIndex} className="flex items-center space-x-3">
                            <input
                              type={q.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                              name={q.type === 'multiple_choice' ? `correct-${questionIndex}-${aIndex}` : `correct-${questionIndex}`}
                              checked={answer.isCorrect}
                              onChange={() => setCorrectAnswer(questionIndex, aIndex, q.type === 'multiple_choice')}
                              className={q.type === 'multiple_choice' ? 'rounded border-gray-300 text-blue-600 focus:ring-blue-500' : 'text-blue-600 focus:ring-blue-500'}
                              title={q.type === 'multiple_choice' ? 'Cocher/décocher comme réponse correcte' : 'Marquer comme réponse correcte'}
                            />
                            <input
                              type="text"
                              value={answer.answer}
                              onChange={(e) => updateAnswer(questionIndex, aIndex, 'answer', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Réponse ${aIndex + 1}`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => removeAnswer(questionIndex, aIndex)}
                              className="text-red-600 hover:text-red-700 p-1"
                              disabled={q.answers!.length <= 2}
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
                {q.type === 'text' && (
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
              <div>
                <span className="text-gray-500">Timer / question :</span>
                <span className="ml-1 font-medium">
                  {quizData.questionTimeLimitSec ? `${quizData.questionTimeLimitSec}s` : 'Aucun'}
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
