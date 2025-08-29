import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, BookOpen, Users, Settings, FolderOpen, Clock, Database } from 'lucide-react';
import './AdminFormationsPage.css';
import '../styles/admin-typography.css';
import { formationsApi, quizApi, bankFormationApi } from '../../../api/adminApi';
import { Formation } from '../types';
import { getFormationCoverImageUrl } from '../../../utils/imageUtils';
import { FormationModal } from './FormationModal';
import ConfirmModal from './ConfirmModal';
import QuizConfigModal from './QuizConfigModal';
import FormationContentManager from './FormationContentManager';
import FormationDetailView from './FormationDetailView';
import BanksListView from './BanksListView';

const AdminFormationsPage: React.FC = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showContentManager, setShowContentManager] = useState(false);
  const [showFormationDetail, setShowFormationDetail] = useState(false);
  const [showBanksList, setShowBanksList] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [action, setAction] = useState<'edit' | 'delete' | 'quiz' | null>(null);
  const [formationStats, setFormationStats] = useState<Record<string, { bankCount: number; userCount: number }>>({});

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
      const formationsData = response.data.data || [];
      setFormations(formationsData);
      
      // Charger les statistiques pour chaque formation
      const stats: Record<string, { bankCount: number; userCount: number }> = {};
      for (const formation of formationsData) {
        try {
          const statsResponse = await bankFormationApi.getFormationStats(formation.id);
          stats[formation.id] = statsResponse.data || { bankCount: 0, userCount: 0 };
        } catch (error) {
          console.error(`Erreur lors du chargement des stats pour la formation ${formation.id}:`, error);
          stats[formation.id] = { bankCount: 0, userCount: 0 };
        }
      }
      setFormationStats(stats);
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

  const handleEditFormation = async (formation: Formation) => {
    try {
      setSelectedFormation(formation);
      setAction('edit');
      setShowFormationModal(true);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du modal d\'édition:', error);
    }
  };

  const handleDeleteFormation = async (formation: Formation) => {
    try {
      setSelectedFormation(formation);
      setAction('delete');
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la confirmation de suppression:', error);
    }
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

  const handleFormationClick = (formation: Formation) => {
    setSelectedFormation(formation);
    setShowFormationDetail(true);
  };

  const handleLessonsClick = (formation: Formation, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher le déclenchement de handleFormationClick
    setSelectedFormation(formation);
    setShowFormationDetail(true);
  };

  const handleBanksClick = (formation: Formation, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher le déclenchement de handleFormationClick
    setSelectedFormation(formation);
    setShowBanksList(true);
  };

  const handleSaveFormation = async () => {
    try {
      setShowFormationModal(false);
      // Recharger les formations pour avoir les données fraîches
      await loadFormations();
      
      // Si on est en mode détail, mettre à jour selectedFormation avec les nouvelles données
      if (showFormationDetail && selectedFormation) {
        const updatedFormation = formations.find(f => f.id === selectedFormation.id);
        if (updatedFormation) {
          setSelectedFormation(updatedFormation);
        }
      }
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
        
        // Si on était en mode détail, retourner à la liste
        if (showFormationDetail) {
          setShowFormationDetail(false);
        }
        
        // Recharger les formations
        await loadFormations();
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

  // Fonction pour obtenir l'icône de statut
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

  // Fonction pour formater la durée
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Afficher la vue détaillée de la formation
  if (showFormationDetail && selectedFormation) {
    return (
      <FormationDetailView
        formation={selectedFormation}
        formationStats={formationStats[selectedFormation.id]}
        onBack={() => setShowFormationDetail(false)}
        onEdit={handleEditFormation}
        onDelete={handleDeleteFormation}
      />
    );
  }

  // Afficher la liste des banques
  if (showBanksList && selectedFormation) {
    return (
      <BanksListView
        formation={selectedFormation}
        formationStats={formationStats[selectedFormation.id]}
        onBack={() => setShowBanksList(false)}
      />
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

      {/* Liste des formations */}
      <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="admin-title-md admin-title-spacing">Formations disponibles</h2>
          <span className="admin-text-sm admin-badge">{filteredFormations.length} formation(s)</span>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Chargement des formations...</p>
          </div>
        ) : filteredFormations.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune formation trouvée</p>
            <p className="text-gray-400">Commencez par créer votre première formation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFormations.map((formation) => (
              <div 
                key={formation.id} 
                className="bg-gradient-to-b from-white to-blue-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleFormationClick(formation)}
              >
                <div className="relative h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  {formation.coverImage ? (
                    <img
                      src={getFormationCoverImageUrl(formation.coverImage)}
                      alt={`Couverture de ${formation.title}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Erreur de chargement de l\'image de couverture:', formation.coverImage);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback si pas d'image */}
                  <div className={`w-full h-full flex items-center justify-center ${formation.coverImage ? 'hidden' : ''}`}>
                    <BookOpen className="h-16 w-16 text-gray-400" />
                  </div>
                  
                  {/* Badge de statut */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(formation);
                      }}
                      className="cursor-pointer"
                    >
                      {getStatusIcon(formation.isActive)}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="admin-card-title admin-title-spacing line-clamp-2">{formation.title}</h3>
                  <p className="admin-text-sm admin-body-spacing line-clamp-3">{formation.description}</p>
                  
                  {/* Statistiques */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{formatDuration(formation.totalDuration || formation.duration)}</span>
                    </div>
                    
                    {/* Leçons et banques placées horizontalement */}
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <div 
                        className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={(e) => handleLessonsClick(formation, e)}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>{formation.lessonCount || 0} leçon(s)</span>
                      </div>
                      
                      <div 
                        className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={(e) => handleBanksClick(formation, e)}
                      >
                        <Database className="h-4 w-4 mr-2" />
                        <span>{formationStats[formation.id]?.bankCount || 0} banque(s)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {formation.hasQuiz ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Quiz configuré
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Quiz non configuré
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManageContent(formation);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center action-button"
                      title="Gérer le contenu"
                    >
                      <FolderOpen className="h-3 w-3 mr-1" />
                      Contenu
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfigureQuiz(formation);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center action-button"
                      title="Configurer le quiz"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Quiz
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFormation(formation);
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center action-button"
                      title="Modifier"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFormation(formation);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center action-button"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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