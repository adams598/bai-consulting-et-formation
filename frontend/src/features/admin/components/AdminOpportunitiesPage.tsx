import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Eye, Download, Calendar, User, MoreVertical, Grid, List, Search, Filter, Trash2, UserPlus, Clock, Database, BookOpen, Plus, Upload, X } from 'lucide-react';
import '../styles/admin-typography.css';
import { opportunitiesApi } from '../../../api/adminApi';
import { authService } from '../../../services/authService';
import { useConfirmation } from '../../../hooks/useConfirmation';
import { getOpportunityFileUrl } from '../../../utils/imageUtils';

interface OpportunityFile {
  id: string;
  formationId: string;
  formationTitle: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  coverImage?: string;
}

const AdminOpportunitiesPage: React.FC = () => {
  const [opportunityFiles, setOpportunityFiles] = useState<OpportunityFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<OpportunityFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Hook de confirmation
  const confirmation = useConfirmation();

  // Charger les fichiers PDF de présentation
  useEffect(() => {
    loadOpportunityFiles();
  }, []);

  // Filtrer les fichiers selon le terme de recherche
  useEffect(() => {
    if (!Array.isArray(opportunityFiles)) {
      setFilteredFiles([]);
      return;
    }
    
    if (!searchTerm.trim()) {
      setFilteredFiles(opportunityFiles);
    } else {
      const filtered = opportunityFiles.filter(file =>
        file.formationTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [searchTerm, opportunityFiles]);

  // Fermer le menu déroulant quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeDropdown && !target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Vérifier si l'utilisateur est admin
  const isAdmin = (): boolean => {
    const user = authService.getCurrentUser();
    return !!(user && (user.role === 'SUPER_ADMIN' || user.role === 'BANK_ADMIN'));
  };

  const loadOpportunityFiles = async () => {
    try {
      setIsLoading(true);
      const response = await opportunitiesApi.getPresentationFiles();
      console.log('📄 Réponse API opportunities:', response);
      
      // Vérifier la structure de la réponse
      let files = [];
      if (response.data && response.data.data) {
        // Structure ApiResponse<T>
        files = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        // Structure directe
        files = response.data;
      } else {
        console.warn('⚠️ Structure de réponse inattendue:', response.data);
        files = [];
      }
      
      console.log('📁 Fichiers chargés:', files);
      setOpportunityFiles(files);
      setFilteredFiles(files);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
      // En cas d'erreur, initialiser avec un tableau vide
      setOpportunityFiles([]);
      setFilteredFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewFile = (file: OpportunityFile) => {
    // Ouvrir le fichier PDF dans un nouvel onglet
    const fileUrl = getOpportunityFileUrl(file.fileName);
    window.open(fileUrl, '_blank');
  };

  const handleDeleteFile = (file: OpportunityFile) => {
    confirmation.showConfirmation({
      title: 'Supprimer le fichier PDF',
      message: `Êtes-vous sûr de vouloir supprimer le fichier "${file.fileName}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      type: 'danger',
      onConfirm: async () => {
        try {
          await opportunitiesApi.deletePresentationFile(file.fileName);
          
          // Mise à jour optimiste
          setOpportunityFiles(prev => prev.filter(f => f.id !== file.id));
          setFilteredFiles(prev => prev.filter(f => f.id !== file.id));
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
        }
      }
    });
  };

  const handleInviteUser = (file: OpportunityFile) => {
    // TODO: Implémenter la fonctionnalité d'invitation
    console.log('Invitation pour le fichier:', file.id);
    // Ouvrir un modal d'invitation
  };

  const handleFileSelect = (file: File) => {
    // Vérifier que c'est bien un PDF
    if (file.type !== 'application/pdf') {
      alert('Veuillez sélectionner un fichier PDF valide.');
      return;
    }

    // Vérifier la taille (50 MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximale : 50 MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadFile = async (file: File) => {
    try {
      setUploadingFile(true);
      const response = await opportunitiesApi.uploadPresentationFile(file);
      
      if (response.data.success) {
        // Ajouter le nouveau fichier à la liste
        const newFile = response.data.data;
        setOpportunityFiles(prev => [newFile, ...prev]);
        setFilteredFiles(prev => [newFile, ...prev]);
        setShowUploadModal(false);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload du fichier. Veuillez réessayer.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      handleFileSelect(file);
    }
  };

  const toggleDropdown = (fileId: string) => {
    setActiveDropdown(activeDropdown === fileId ? null : fileId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contrôles de vue et recherche */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Barre de recherche */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher un fichier PDF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Contrôles de vue */}
        <div className="flex items-center gap-3">
          {/* Sélecteur de vue */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vue grille"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vue liste"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="admin-title-md admin-title-spacing">
            Fichiers PDF de présentation
          </h2>
          
          {isAdmin() && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Ajouter un PDF
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Chargement...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun fichier PDF trouvé</p>
            <p className="text-gray-400">
              {searchTerm ? 'Aucun fichier ne correspond à votre recherche.' : 'Aucun fichier PDF de présentation disponible.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Vue grille - 4 PDF par ligne */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="p-3 hover:bg-gray-50 hover:border-gray-200 transition-shadow relative"
              >
                {/* Menu Admin (3 points) - Visible uniquement pour les admins */}
                {isAdmin() && (
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === file.id ? null : file.id);
                      }}
                      className="dropdown-trigger p-1 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                      title="Actions d'administration"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </button>

                    {/* Menu déroulant */}
                    {activeDropdown === file.id && (
                      <div key={`dropdown-${file.id}`} className="dropdown-menu absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 z-20">
                        <button
                          key={`invite-${file.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInviteUser(file);
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Inviter à lire
                        </button>

                        <div key={`separator-${file.id}`} className="border-t border-gray-200 my-1"></div>

                        <button
                          key={`delete-${file.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file);
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div 
                  className="relative mb-3 group cursor-pointer text-center p-3"
                  onClick={() => handleViewFile(file)}
                >
                  {/* Icône PDF */}
                  <div className="flex justify-center mb-2">
                    <FileText className="h-16 w-16 text-red-600" />
                  </div>
                  
                  {/* Titre */}
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">
                    {file.formationTitle}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vue liste */
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* En-tête des colonnes */}
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center text-sm font-medium text-gray-700">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-5 mr-2"></div>
                <span>Nom</span>
              </div>
              <div className="w-20 flex-shrink-0 text-right">Taille</div>
              <div className="w-32 flex-shrink-0">Date d'ajout</div>
              <div className="w-24 flex-shrink-0">Ajouté par</div>
              <div className="w-8 flex-shrink-0"></div>
            </div>
            
            {filteredFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center py-1 px-3 hover:bg-blue-50 cursor-pointer group border-b border-gray-100 last:border-b-0 text-sm"
                onClick={() => handleViewFile(file)}
              >
                {/* Colonne Nom */}
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-5 h-5 mr-2 flex-shrink-0">
                    <FileText className="w-full h-full text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-gray-900 font-normal truncate">
                      {file.formationTitle}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {file.fileName}
                    </div>
                  </div>
                </div>
                
                {/* Colonne Taille */}
                <div className="w-20 text-gray-600 flex-shrink-0 text-right">
                  {formatFileSize(file.fileSize)}
                </div>
                
                {/* Colonne Date d'ajout */}
                <div className="w-32 text-gray-600 flex-shrink-0">
                  {formatDate(file.uploadDate)}
                </div>
                
                {/* Colonne Ajouté par */}
                <div className="w-24 text-gray-600 flex-shrink-0 truncate">
                  {file.uploadedBy}
                </div>
                
                {/* Menu contextuel - Visible uniquement pour les admins */}
                {isAdmin() && (
                  <div className="w-8 flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === file.id ? null : file.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Actions d'administration"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  
                    {/* Menu déroulant */}
                    {activeDropdown === file.id && (
                      <div className="absolute right-4 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInviteUser(file);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Inviter à lire
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'upload de PDF */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ajouter un fichier PDF
                </h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setIsDragOver(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={uploadingFile}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Zone de drop */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors relative ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${isDragOver ? 'text-blue-700' : 'text-gray-900'}`}>
                      {isDragOver ? 'Relâchez le fichier ici' : 'Glissez-déposez votre fichier PDF ici'}
                    </p>
                    <p className="text-xs text-gray-500">
                      ou cliquez pour sélectionner un fichier
                    </p>
                  </div>
                  
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileSelect(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingFile}
                  />
                </div>

                {/* Informations sur le fichier sélectionné */}
                {selectedFile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-red-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={uploadingFile}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Instructions :
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Formats acceptés : PDF uniquement</li>
                    <li>• Taille maximale : 50 MB</li>
                    <li>• Le nom du fichier sera automatiquement formaté</li>
                    <li>• Le fichier sera accessible dans l'onglet "Traitement des opportunités commerciales"</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setIsDragOver(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={uploadingFile}
                >
                  Annuler
                </button>
                {selectedFile && !uploadingFile && (
                  <button
                    onClick={() => handleUploadFile(selectedFile)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Uploader le fichier
                  </button>
                )}
                {uploadingFile && (
                  <div className="flex items-center px-4 py-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Upload en cours...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ display: confirmation.isOpen ? 'flex' : 'none' }}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {confirmation.options?.title || 'Confirmation'}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmation.options?.message || 'Êtes-vous sûr de vouloir continuer ?'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={confirmation.hideConfirmation}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={confirmation.isLoading}
              >
                Annuler
              </button>
              <button
                onClick={confirmation.handleConfirm}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  confirmation.options?.type === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={confirmation.isLoading}
              >
                {confirmation.isLoading ? 'Chargement...' : (confirmation.options?.confirmText || 'Confirmer')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOpportunitiesPage;
