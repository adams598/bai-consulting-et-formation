import React, { useState, useEffect } from 'react';
import { X, Check, XCircle } from 'lucide-react';
import { Formation } from '../types';

interface FormationAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignments: Array<{ formationId: string; isMandatory: boolean }>) => void;
  availableFormations: Formation[];
  currentAssignments?: Array<{ formationId: string; isMandatory: boolean }>;
}

const FormationAssignmentModal: React.FC<FormationAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableFormations,
  currentAssignments = []
}) => {
  const [assignments, setAssignments] = useState<Array<{ formationId: string; isMandatory: boolean }>>([]);

  useEffect(() => {
    if (currentAssignments.length > 0) {
      setAssignments(currentAssignments);
    } else {
      // Initialiser avec toutes les formations disponibles
      setAssignments(availableFormations.map(f => ({
        formationId: f.id,
        isMandatory: false
      })));
    }
  }, [availableFormations, currentAssignments]);

  const toggleAssignment = (formationId: string) => {
    setAssignments(prev => {
      const exists = prev.find(a => a.formationId === formationId);
      if (exists) {
        return prev.filter(a => a.formationId !== formationId);
      } else {
        return [...prev, { formationId, isMandatory: false }];
      }
    });
  };

  const toggleMandatory = (formationId: string) => {
    setAssignments(prev => prev.map(a => 
      a.formationId === formationId 
        ? { ...a, isMandatory: !a.isMandatory }
        : a
    ));
  };

  const isAssigned = (formationId: string) => {
    return assignments.some(a => a.formationId === formationId);
  };

  const isMandatory = (formationId: string) => {
    return assignments.find(a => a.formationId === formationId)?.isMandatory || false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(assignments);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Assigner des Formations
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3">
            {availableFormations.map((formation) => {
              const assigned = isAssigned(formation.id);
              const mandatory = isMandatory(formation.id);
              
              return (
                <div key={formation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{formation.title}</h3>
                      <p className="text-sm text-gray-600">{formation.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Durée: {formation.duration} min</span>
                        <span>Leçons: {formation.lessonCount || 0}</span>
                        {formation.hasQuiz && (
                          <span className="text-green-600">Quiz inclus</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Bouton d'assignation */}
                      <button
                        type="button"
                        onClick={() => toggleAssignment(formation.id)}
                        className={`p-2 rounded-full ${
                          assigned 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={assigned ? 'Retirer la formation' : 'Assigner la formation'}
                      >
                        {assigned ? <Check className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </button>
                      
                      {/* Bouton obligatoire (seulement si assignée) */}
                      {assigned && (
                        <button
                          type="button"
                          onClick={() => toggleMandatory(formation.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            mandatory
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={mandatory ? 'Rendre optionnelle' : 'Rendre obligatoire'}
                        >
                          {mandatory ? 'Obligatoire' : 'Optionnelle'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Sauvegarder les Assignations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormationAssignmentModal;

