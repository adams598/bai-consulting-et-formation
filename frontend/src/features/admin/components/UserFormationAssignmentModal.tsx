import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Clock, Users, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import { formationsApi, assignmentsApi, userFormationAssignmentApi, universesApi } from '../../../api/adminApi';
import { Formation, User, FormationAssignment, Universe } from '../types';
import ConfirmationModal from './ConfirmationModal';

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
  const [activeTab, setActiveTab] = useState<'assign' | 'assigned'>('assign');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [assignedFormations, setAssignedFormations] = useState<FormationAssignment[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [assignmentConfig, setAssignmentConfig] = useState<{
    isMandatory: boolean;
    dueDate: string;
  }>({
    isMandatory: true,
    dueDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);
  const [unassignData, setUnassignData] = useState<{ assignmentId: string; formationTitle: string } | null>(null);
  const [isUnassigning, setIsUnassigning] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFormations();
      loadAssignedFormations();
      loadUniverses();
      // Réinitialiser l'état
      setSelectedFormations([]);
      setSelectedAssignments([]);
      setSearchTerm('');
      setAssignmentConfig({ isMandatory: true, dueDate: '' });
      setActiveTab('assign');
    }
  }, [isOpen]);

  useEffect(() => {
    // Obtenir les IDs des formations déjà assignées
    const assignedFormationIds = assignedFormations.map(assignment => 
      assignment.formation?.id || assignment.formationId
    );

    // Filtrer les formations pour exclure celles déjà assignées
    const availableFormations = formations.filter(
      formation => !assignedFormationIds.includes(formation.id)
    );

    // Filtrer les formations basé sur le terme de recherche
    if (!searchTerm.trim()) {
      setFilteredFormations(availableFormations);
    } else {
      const filtered = availableFormations.filter(formation =>
        formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFormations(filtered);
    }
  }, [formations, assignedFormations, searchTerm]);

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

  const loadAssignedFormations = async () => {
    try {
      setIsLoadingAssigned(true);
      const response = await assignmentsApi.getByUser(user.id);
      
      if (response.data?.success) {
        const assignmentsData = response.data.data || [];
        setAssignedFormations(assignmentsData);
        console.log('Formations assignées chargées:', assignmentsData.length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations assignées:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les formations assignées",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAssigned(false);
    }
  };

  const loadUniverses = async () => {
    try {
      const response = await universesApi.getAll();
      if (response.data?.success) {
        setUniverses(response.data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des univers:', error);
    }
  };

  const getUniverseName = (assignment: FormationAssignment): string => {
    // Essayer d'abord depuis l'assignation (si l'API retourne universeId)
    const universeId = assignment.formation?.universeId;
    
    if (!universeId) {
      // Fallback : chercher dans la liste des formations chargées
      const formation = formations.find(f => f.id === assignment.formationId);
      if (formation?.universeId) {
        const universe = universes.find(u => u.id === formation.universeId);
        return universe?.name || 'Aucun univers';
      }
      return 'Aucun univers';
    }
    
    // Trouver l'univers correspondant
    const universe = universes.find(u => u.id === universeId);
    return universe?.name || 'Aucun univers';
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

      // Recharger les formations assignées
      await loadAssignedFormations();
      
      // Réinitialiser la sélection
      setSelectedFormations([]);
      
      // Basculer vers l'onglet des formations assignées
      setActiveTab('assigned');
      
      // Notifier le parent
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

  const handleAssignmentToggle = (assignmentId: string) => {
    setSelectedAssignments(prev => {
      if (prev.includes(assignmentId)) {
        return prev.filter(id => id !== assignmentId);
      } else {
        return [...prev, assignmentId];
      }
    });
  };

  const handleSelectAllAssignments = () => {
    if (selectedAssignments.length === assignedFormations.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(assignedFormations.map(a => a.id));
    }
  };

  const handleUnassignFormations = () => {
    if (selectedAssignments.length === 0) {
      toast({
        title: "Attention",
        description: "Veuillez sélectionner au moins une formation à dé-assigner",
        variant: "destructive",
      });
      return;
    }

    // Préparer les données pour la modale de confirmation
    const assignmentsToUnassign = assignedFormations.filter(a => selectedAssignments.includes(a.id));
    const formationTitles = assignmentsToUnassign.map(a => a.formation?.title || 'Formation sans titre').join(', ');
    
    setUnassignData({ 
      assignmentId: selectedAssignments.join(','), // Utiliser une chaîne séparée par des virgules
      formationTitle: formationTitles 
    });
    setShowUnassignConfirm(true);
  };

  const confirmUnassignFormation = async () => {
    if (!unassignData) return;

    try {
      setIsUnassigning(true);
      
      // Si plusieurs assignments, les supprimer un par un
      const assignmentIds = unassignData.assignmentId.split(',');
      
      for (const assignmentId of assignmentIds) {
        await assignmentsApi.delete(assignmentId);
      }
      
      const count = assignmentIds.length;
      toast({
        title: "Succès",
        description: `${count} formation(s) dé-assignée(s) avec succès`,
      });

      // Recharger les formations assignées ET les formations disponibles
      await Promise.all([
        loadAssignedFormations(),
        loadFormations()
      ]);
      
      // Réinitialiser la sélection
      setSelectedAssignments([]);
      
      // Fermer la modale de confirmation
      setShowUnassignConfirm(false);
      setUnassignData(null);
      
      // Notifier le parent
      onAssigned();
      
    } catch (error: any) {
      console.error('Erreur lors de la dé-assignation:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la dé-assignation des formations",
        variant: "destructive",
      });
    } finally {
      setIsUnassigning(false);
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
    <>
      {/* Modale principale */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gestion des formations
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{user.firstName} {user.lastName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline-block mr-2" />
              Assigner des formations
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline-block mr-2" />
              Formations assignées ({assignedFormations.length})
            </button>
          </nav>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Tab: Assigner des formations */}
          {activeTab === 'assign' && (
            <>
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
            </>
          )}

          {/* Tab: Formations assignées */}
          {activeTab === 'assigned' && (
            <div className="p-6">
              {isLoadingAssigned ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : assignedFormations.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">Aucune formation assignée</p>
                  <p className="text-sm text-gray-400">
                    Utilisez l'onglet "Assigner des formations" pour assigner des formations à cet utilisateur.
                  </p>
                </div>
              ) : (
                <>
                  {/* Barre d'actions pour la sélection multiple */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {selectedAssignments.length} / {assignedFormations.length} sélectionnée(s)
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllAssignments}
                        disabled={assignedFormations.length === 0}
                      >
                        {selectedAssignments.length === assignedFormations.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </Button>
                    </div>
                    {selectedAssignments.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnassignFormations}
                        className="border-red-200 text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Dé-assigner ({selectedAssignments.length})
                      </Button>
                    )}
                  </div>

                  {/* Liste des formations assignées */}
                  <div className="space-y-3">
                    {assignedFormations.map((assignment) => {
                      const universeName = getUniverseName(assignment);
                      
                      return (
                        <div
                          key={assignment.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            selectedAssignments.includes(assignment.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedAssignments.includes(assignment.id)}
                                onChange={() => handleAssignmentToggle(assignment.id)}
                                className="mt-1 rounded border-gray-300"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {assignment.formation?.title || 'Formation sans titre'}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Univers:</span> {universeName}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  {assignment.formation?.duration && (
                                    <div className="flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {formatDuration(assignment.formation.duration)}
                                    </div>
                                  )}
                                  <div className="flex items-center">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                      assignment.isMandatory
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {assignment.isMandatory ? 'Obligatoire' : 'Optionnelle'}
                                    </span>
                                  </div>
                                  {assignment.dueDate && (
                                    <div className="flex items-center text-xs text-gray-500">
                                      Échéance: {new Date(assignment.dueDate).toLocaleDateString('fr-FR')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {selectedAssignments.length === 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssignments([assignment.id]);
                                  handleUnassignFormations();
                                }}
                                className="ml-4 border-red-200 text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Dé-assigner
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          {activeTab === 'assign' ? (
            <>
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
            </>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
            >
              Fermer
            </Button>
          )}
        </div>
        </div>
      </div>

      {/* Modale de confirmation pour la dé-assignation */}
      {showUnassignConfirm && unassignData && (
        <ConfirmationModal
          isOpen={showUnassignConfirm}
          onClose={() => {
            setShowUnassignConfirm(false);
            setUnassignData(null);
          }}
          onConfirm={confirmUnassignFormation}
          title="Confirmer la dé-assignation"
          message={
            unassignData.assignmentId.includes(',')
              ? `Êtes-vous sûr de vouloir dé-assigner ${unassignData.assignmentId.split(',').length} formation(s) de ${user.firstName} ${user.lastName} ?`
              : `Êtes-vous sûr de vouloir dé-assigner la formation "${unassignData.formationTitle}" de ${user.firstName} ${user.lastName} ?`
          }
          confirmText="Dé-assigner"
          cancelText="Annuler"
          type="warning"
          isLoading={isUnassigning}
        />
      )}
    </>
  );
};

export default UserFormationAssignmentModal;

