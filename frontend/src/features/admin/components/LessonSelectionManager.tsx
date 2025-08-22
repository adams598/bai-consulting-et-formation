import React, { useState } from 'react';
import { FormationContent } from '../types';
import { X, Move, Trash2, CheckSquare, Square } from 'lucide-react';

interface LessonSelectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: FormationContent[];
  sections: FormationContent[];
  onAssignToSection: (lessonIds: string[], sectionId: string) => Promise<void>;
  onDeleteMultiple: (lessonIds: string[]) => Promise<void>;
}

const LessonSelectionManager: React.FC<LessonSelectionManagerProps> = ({
  isOpen,
  onClose,
  lessons,
  sections,
  onAssignToSection,
  onDeleteMultiple
}) => {
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [targetSection, setTargetSection] = useState<string>('');

  if (!isOpen) return null;

  const toggleLessonSelection = (lessonId: string) => {
    const newSelected = new Set(selectedLessons);
    if (newSelected.has(lessonId)) {
      newSelected.delete(lessonId);
    } else {
      newSelected.add(lessonId);
    }
    setSelectedLessons(newSelected);
  };

  const handleAssignToSection = async () => {
    if (targetSection && selectedLessons.size > 0) {
      await onAssignToSection(Array.from(selectedLessons), targetSection);
      setSelectedLessons(new Set());
      setTargetSection('');
      onClose();
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedLessons.size > 0) {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedLessons.size} leçon(s) ?`)) {
        await onDeleteMultiple(Array.from(selectedLessons));
        setSelectedLessons(new Set());
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="bg-brand-blue text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gestion des leçons sélectionnées</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Actions disponibles */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Actions disponibles</h3>
            <div className="flex flex-wrap gap-3">
              {/* Affecter à une section */}
              <div className="flex items-center space-x-3">
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                >
                  <option value="">Sélectionner une section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignToSection}
                  disabled={!targetSection || selectedLessons.size === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Move className="h-4 w-4" />
                  Affecter à la section
                </button>
              </div>

              {/* Supprimer */}
              <button
                onClick={handleDeleteMultiple}
                disabled={selectedLessons.size === 0}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer ({selectedLessons.size})
              </button>
            </div>
          </div>

          {/* Liste des leçons */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">
              Leçons disponibles ({lessons.length})
            </h3>
            
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`p-4 border rounded-lg transition-all ${
                  selectedLessons.has(lesson.id)
                    ? 'border-brand-blue bg-brand-blue/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Checkbox de sélection */}
                  <button
                    onClick={() => toggleLessonSelection(lesson.id)}
                    className="flex-shrink-0"
                  >
                    {selectedLessons.has(lesson.id) ? (
                      <CheckSquare className="h-5 w-5 text-brand-blue" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400 hover:text-brand-blue transition-colors" />
                    )}
                  </button>

                  {/* Informations de la leçon */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                    {lesson.description && (
                      <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Type: {lesson.type}</span>
                      {lesson.duration && <span>Durée: {lesson.duration} min</span>}
                      <span>Ordre: {lesson.order}</span>
                    </div>
                  </div>

                  {/* Section actuelle */}
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Section actuelle:</span>
                    <div className="text-sm font-medium text-gray-900">
                      {lesson.sectionId 
                        ? sections.find(s => s.id === lesson.sectionId)?.title || 'Inconnue'
                        : 'Aucune section'
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonSelectionManager;
