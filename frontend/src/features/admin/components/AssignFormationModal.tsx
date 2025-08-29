import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, Circle, Plus } from 'lucide-react';
import { Formation } from '../types';
import { formationsApi } from '../../../api/adminApi';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import CreateFormationModal from './CreateFormationModal';

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
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateFormationModal, setShowCreateFormationModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFormations();
      setSelectedFormations([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    // Filtrer les formations selon le terme de recherche
    if (searchTerm.trim() === '') {
      setFilteredFormations(formations);
    } else {
      const filtered = formations.filter(formation =>
        formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFormations(filtered);
    }
  }, [formations, searchTerm]);

  const loadFormations = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des formations...');
      
      const response = await formationsApi.getAllFormations();
      console.log('📡 Réponse API formations:', response);
      
      if (response.data?.success) {
        const formationsData = response.data.data || [];
        console.log('✅ Formations chargées:', formationsData.length);
        setFormations(formationsData);
        setFilteredFormations(formationsData);
      } else {
        console.error('❌ Erreur API formations:', response.data);
        toast({
          title: "Erreur",
          description: "Impossible de charger les formations",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Erreur lors du chargement des formations:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des formations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const handleAssign = () => {
    if (selectedFormations.length > 0) {
      onAssign(selectedFormations);
      setSelectedFormations([]);
    }
  };

  const handleFormationCreated = () => {
    // Recharger les formations après création
    loadFormations();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Assigner des formations à la banque
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Sélectionnez les formations que vous souhaitez assigner
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {/* Barre d'actions */}
            <div className="flex justify-between items-center mb-6">
              {/* Barre de recherche */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Rechercher une formation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Bouton créer formation */}
              <Button
                onClick={() => setShowCreateFormationModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une formation
              </Button>
            </div>

            {/* Sélection globale */}
            {filteredFormations.length > 0 && (
              <div className="mb-4 flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-sm"
                >
                  {selectedFormations.length === filteredFormations.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedFormations.length} formation(s) sélectionnée(s) sur {filteredFormations.length}
                </span>
              </div>
            )}

            {/* Liste des formations */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Chargement des formations...</span>
              </div>
            ) : filteredFormations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {searchTerm ? (
                    <>
                      <Search className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-lg font-medium">Aucune formation trouvée</p>
                      <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📚</span>
                      </div>
                      <p className="text-lg font-medium">Aucune formation disponible</p>
                      <p className="text-sm mb-4">Créez d'abord des formations pour pouvoir les assigner</p>
                      <Button
                        onClick={() => setShowCreateFormationModal(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer votre première formation
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <div className="divide-y divide-gray-200">
                  {filteredFormations.map((formation) => {
                    const isSelected = selectedFormations.includes(formation.id);
                    return (
                      <div
                        key={formation.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleFormationToggle(formation.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {isSelected ? (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {formation.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {formatDuration(formation.duration)}
                                </span>
                                {formation.hasQuiz && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Quiz
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {formation.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedFormations.length === 0 || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Assigner ({selectedFormations.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de création de formation */}
      {showCreateFormationModal && (
        <CreateFormationModal
          isOpen={showCreateFormationModal}
          onClose={() => setShowCreateFormationModal(false)}
          onFormationCreated={handleFormationCreated}
        />
      )}
    </>
  );
};

export default AssignFormationModal;
