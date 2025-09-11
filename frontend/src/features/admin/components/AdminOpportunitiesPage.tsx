import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, Calendar, User, MoreVertical, Grid, List, Search, Filter } from 'lucide-react';
import '../styles/admin-typography.css';
import { opportunitiesApi } from '../../../api/adminApi';

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

  // Charger les fichiers PDF de présentation
  useEffect(() => {
    loadOpportunityFiles();
  }, []);

  // Filtrer les fichiers selon le terme de recherche
  useEffect(() => {
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

  const loadOpportunityFiles = async () => {
    try {
      setIsLoading(true);
      const response = await opportunitiesApi.getPresentationFiles();
      setOpportunityFiles(response.data);
      setFilteredFiles(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
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
    window.open(file.filePath, '_blank');
  };

  const handleDownloadFile = (file: OpportunityFile) => {
    // Télécharger le fichier
    const link = document.createElement('a');
    link.href = file.filePath;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Barre d'outils */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Fichiers PDF de présentation</h2>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-gray-800 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-gray-800 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un fichier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total des fichiers</p>
                <p className="text-2xl font-bold text-blue-600">{opportunityFiles.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Formations avec PDF</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(opportunityFiles.map(f => f.formationId)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <User className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Dernière mise à jour</p>
                <p className="text-sm font-bold text-purple-600">
                  {opportunityFiles.length > 0 
                    ? formatDate(Math.max(...opportunityFiles.map(f => new Date(f.uploadDate).getTime())).toString())
                    : 'Aucun fichier'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des fichiers */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun fichier trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Aucun fichier ne correspond à votre recherche.' : 'Aucun fichier PDF de présentation disponible.'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4'
        }>
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Image de couverture */}
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    {file.coverImage ? (
                      <img
                        src={file.coverImage}
                        alt={file.formationTitle}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Contenu de la carte */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {file.formationTitle}
                      </h3>
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(file.id)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {activeDropdown === file.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleViewFile(file);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Voir le fichier
                              </button>
                              <button
                                onClick={() => {
                                  handleDownloadFile(file);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Fichier:</span> {file.fileName}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Taille:</span> {formatFileSize(file.fileSize)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> PDF
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Ajouté le:</span> {formatDate(file.uploadDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Par:</span> {file.uploadedBy}
                      </p>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => handleViewFile(file)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        Voir
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Télécharger
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Vue liste */}
                  <div className="flex-1 flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {file.formationTitle}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {file.fileName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadDate)}</span>
                        <span>•</span>
                        <span>{file.uploadedBy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewFile(file)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      Voir
                    </button>
                    <button
                      onClick={() => handleDownloadFile(file)}
                      className="bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4 inline mr-1" />
                      Télécharger
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(file.id)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      {activeDropdown === file.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                handleViewFile(file);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Voir le fichier
                            </button>
                            <button
                              onClick={() => {
                                handleDownloadFile(file);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOpportunitiesPage;
