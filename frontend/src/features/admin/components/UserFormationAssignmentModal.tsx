import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Clock, Users, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import { formationsApi, assignmentsApi } from '../../../api/adminApi';
import { Formation, User } from '../types';

interface UserFormationAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onAssigned: () => void;
}

interface FormationAssignmentData {
  formationId: string;
  isMandatory: boolean;
  dueDate?: string;
}

const UserFormationAssignmentModal: React.FC<UserFormationAssignmentModalProps> = ({
  isOpen,
  onClose,
  user,
  onAssigned
}) => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [assignmentConfig, setAssignmentConfig] = useState<{
    isMandatory: boolean;
    dueDate: string;
  }>({
    isMandatory: true,
    dueDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFormations();
      // Réinitialiser l'état
      setSelectedFormations([]);
      setSearchTerm('');
      setAssignmentConfig({ isMandatory: true, dueDate: '' });
    }
  }, [isOpen]);

  useEffect(() => {
    // Filtrer les formations basé sur le terme de recherche
    if (!searchTerm.trim()) {
      setFilteredFormations(formations);
    } else {
      const filtered = formations.filter(formation =>
        formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFormations(filtered);
    }
  }, [formations, searchTerm]);

  const loadFormations = async () => {
    try {
      setIsLoading(true);
      const response = await formationsApi.getAllFormations();
      
      if (response.data?.success) {
        const formationsData = response.data.data || [];
        // Filtrer seulement les formations actives
        const activeFormations = formationsData.filter(f => f.isActive);
        setFormations(activeFormations);
        setFilteredFormations(activeFormations);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les formations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormationToggle = (formationId: string) => {
    setSelectedFormations(prev => {
      if (prev.includes(formationId)) {
        return prev.filter(id => id !== formationId);
      } else {
        return [...prev, formationId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedFormations.length === filteredFormations.length) {
      setSelectedFormations([]);
    } else {
      setSelectedFormations(filteredFormations.map(f => f.id));
    }
  };

  const handleAssignFormations = async () => {
    if (selectedFormations.length === 0) {
      toast({
        title: "Attention",
        description: "Veuillez sélectionner au moins une formation",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAssigning(true);
      
      // Créer les assignations pour chaque formation sélectionnée
      const assignments: FormationAssignmentData[] = selectedFormations.map(formationId => ({
        formationId,
        isMandatory: assignmentConfig.isMandatory,
        dueDate: assignmentConfig.dueDate || undefined
      }));

      // Effectuer les assignations une par une
      for (const assignment of assignments) {
        await assignmentsApi.create({
          userId: user.id,
          formationId: assignment.formationId,
          isMandatory: assignment.isMandatory,
          dueDate: assignment.dueDate
        });
      }

      toast({
        title: "Succès",
        description: `${assignments.length} formation(s) assignée(s) avec succès à ${user.firstName} ${user.lastName}`,
      });

      // Fermer le modal et notifier le parent
      onClose();
      onAssigned();
      
    } catch (error: any) {
      console.error('Erreur lors de l\'assignation des formations:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'assignation des formations",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Assigner des formations
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Assigner des formations à <span className="font-medium">{user.firstName} {user.lastName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Configuration des assignations */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Configuration des assignations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isMandatory"
                checked={assignmentConfig.isMandatory}
                onChange={(e) => setAssignmentConfig(prev => ({
                  ...prev,
                  isMandatory: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="isMandatory" className="text-sm text-gray-700">
                Formation obligatoire
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date limite (optionnelle)
              </label>
              <Input
                type="date"
                value={assignmentConfig.dueDate}
                onChange={(e) => setAssignmentConfig(prev => ({
                  ...prev,
                  dueDate: e.target.value
                }))}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Recherche et sélection */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedFormations.length} / {filteredFormations.length} sélectionnée(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredFormations.length === 0}
              >
                {selectedFormations.length === filteredFormations.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
            </div>
          </div>

          {/* Liste des formations */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredFormations.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Aucune formation trouvée' : 'Aucune formation disponible'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredFormations.map((formation) => (
                  <div
                    key={formation.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedFormations.includes(formation.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleFormationToggle(formation.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedFormations.includes(formation.id)}
                          onChange={() => handleFormationToggle(formation.id)}
                          className="rounded border-gray-300"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{formation.title}</h4>
                          {formation.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {formation.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDuration(formation.duration)}
                            </div>
                            {formation.hasQuiz && (
                              <div className="flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Quiz inclus
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAssigning}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAssignFormations}
            disabled={selectedFormations.length === 0 || isAssigning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAssigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Attribution en cours...
              </>
            ) : (
              `Assigner ${selectedFormations.length} formation(s)`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserFormationAssignmentModal;

