import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, BookOpen, Users, Settings, FolderOpen } from 'lucide-react';
import { formationsApi, quizApi } from '../../../api/adminApi';
import { Formation } from '../types';
import { FormationModal } from './FormationModal';
import ConfirmModal from './ConfirmModal';
import QuizConfigModal from './QuizConfigModal';
import FormationContentManager from './FormationContentManager';

const AdminFormationsPage: React.FC = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showContentManager, setShowContentManager] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [action, setAction] = useState<'edit' | 'delete' | 'quiz' | null>(null);

  useEffect(() => {
    loadFormations();
  }, []);

  useEffect(() => {
    filterFormations();
  }, [formations, searchTerm]);

  const loadFormations = async () => {
    try {
      setIsLoading(true);
      const response = await formationsApi.getAllFormations();
      // L'API retourne { success: true, data: [...] }
      setFormations(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterFormations = () => {
    if (!searchTerm.trim()) {
      setFilteredFormations(formations);
    } else {
      const filtered = formations.filter(formation =>
        formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFormations(filtered);
    }
  };

  const handleCreateFormation = () => {
    setSelectedFormation(null);
    setAction('edit');
    setShowFormationModal(true);
  };

  const handleEditFormation = (formation: Formation) => {
    setSelectedFormation(formation);
    setAction('edit');
    setShowFormationModal(true);
  };

  const handleDeleteFormation = (formation: Formation) => {
    setSelectedFormation(formation);
    setAction('delete');
    setShowConfirmModal(true);
  };

  const handleManageContent = (formation: Formation) => {
    setSelectedFormation(formation);
    setShowContentManager(true);
  };

  const handleConfigureQuiz = (formation: Formation) => {
    setSelectedFormation(formation);
    setAction('quiz');
    setShowQuizModal(true);
  };

  const handleSaveFormation = async () => {
    try {
      setShowFormationModal(false);
      loadFormations();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleSaveQuiz = async (quizData: any) => {
    try {
      if (selectedFormation) {
        // Pour l'instant, on suppose qu'il n'y a pas de quiz existant
        // TODO: Vérifier si un quiz existe déjà
        await quizApi.createQuiz(selectedFormation.id, quizData);
        setShowQuizModal(false);
        loadFormations();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du quiz:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedFormation) {
      try {
        await formationsApi.deleteFormation(selectedFormation.id);
        setShowConfirmModal(false);
        loadFormations();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleToggleActive = async (formation: Formation) => {
    try {
      await formationsApi.toggleActive(formation.id);
      loadFormations();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Actif
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactif
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Formations</h1>
        <button
          onClick={handleCreateFormation}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nouvelle Formation
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher une formation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tableau des formations */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Formation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durée
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leçons
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Banques
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quiz
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFormations.map((formation) => (
              <tr key={formation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                    <div className="text-sm font-medium text-gray-900">{formation.title}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {formation.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDuration(formation.totalDuration || formation.duration)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formation.lessonCount || 0} leçon(s)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Users className="h-4 w-4 mr-2" />
                    {formation.bankCount || 0} banque(s)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {formation.hasQuiz ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Configuré
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Non configuré
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(formation)}
                    className="cursor-pointer"
                  >
                    {getStatusIcon(formation.isActive)}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleManageContent(formation)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Gérer le contenu"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleConfigureQuiz(formation)}
                      className="text-purple-600 hover:text-purple-900 p-1"
                      title="Configurer le quiz"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditFormation(formation)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFormation(formation)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de création/édition de formation */}
      {showFormationModal && (
        <FormationModal
          formation={selectedFormation}
          onClose={() => setShowFormationModal(false)}
          onSave={handleSaveFormation}
        />
      )}

      {/* Modal de configuration du quiz */}
      {showQuizModal && selectedFormation && (
        <QuizConfigModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          onSave={handleSaveQuiz}
          formationId={selectedFormation.id}
          existingQuiz={null}
        />
      )}

      {/* Gestionnaire de contenu */}
      {showContentManager && selectedFormation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <FormationContentManager
              formation={selectedFormation}
              onClose={() => setShowContentManager(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showConfirmModal && (
        <ConfirmModal
          title="Supprimer la formation"
          message={`Êtes-vous sûr de vouloir supprimer la formation "${selectedFormation?.title}" ?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowConfirmModal(false)}
          confirmText="Supprimer"
          variant="danger"
        />
      )}
    </div>
  );
};

export default AdminFormationsPage; 