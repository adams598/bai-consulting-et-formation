import React, { useState, useEffect } from 'react';
import { Formation } from '../types';
import { formationsApi } from '../../../api/adminApi';

interface AssignFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (formationIds: string[]) => void;
  bankId: string;
}

const AssignFormationModal: React.FC<AssignFormationModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  bankId
}) => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFormations();
    }
  }, [isOpen]);

  const loadFormations = async () => {
    try {
      setLoading(true);
      const response = await formationsApi.getAllFormations();
      if (response.success) {
        setFormations(response.data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = () => {
    if (selectedFormations.length > 0) {
      onAssign(selectedFormations);
      setSelectedFormations([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Assigner des formations à la banque
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionner les formations
                </label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                  {formations.map((formation) => (
                    <label key={formation.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedFormations.includes(formation.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFormations([...selectedFormations, formation.id]);
                          } else {
                            setSelectedFormations(selectedFormations.filter(id => id !== formation.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{formation.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAssign}
                  disabled={selectedFormations.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assigner ({selectedFormations.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignFormationModal;
