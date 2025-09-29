import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Eye, 
  Download, 
  Calendar, 
  User, 
  Grid, 
  List, 
  Search,
  Filter, 
  Clock, 
  Database, 
  BookOpen
} from 'lucide-react';
import { opportunitiesApi } from '../../../api/learnerApi';
import { useToast } from '../../../components/ui/use-toast';

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

const OpportunitiesPage: React.FC = () => {
  const [opportunityFiles, setOpportunityFiles] = useState<OpportunityFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<OpportunityFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

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

  const loadOpportunityFiles = async () => {
    try {
      setIsLoading(true);
      const response = await opportunitiesApi.getPresentationFiles();
      console.log('📄 Réponse API opportunities:', response);
      
      // Vérifier la structure de la réponse
      let files = [];
      if (response && typeof response === 'object' && 'data' in response) {
        const responseData = response as any;
        if (responseData.data && responseData.data.data) {
          // Structure ApiResponse<T>
          files = Array.isArray(responseData.data.data) ? responseData.data.data : [];
        } else if (Array.isArray(responseData.data)) {
          // Structure directe
          files = responseData.data;
        } else {
          console.warn('⚠️ Structure de réponse inattendue:', responseData.data);
          files = [];
        }
      } else if (Array.isArray(response)) {
        // Réponse directe en tableau
        files = response;
      } else {
        console.warn('⚠️ Structure de réponse inattendue:', response);
        files = [];
      }
      
      console.log('📁 Fichiers chargés:', files);
      setOpportunityFiles(files);
      setFilteredFiles(files);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fichiers PDF de présentation",
        variant: "destructive"
      });
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
    const fileUrl = opportunitiesApi.getPresentationFileUrl(file.fileName);
    window.open(fileUrl, '_blank');
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
              <div className="w-20 flex-shrink-0 text-right mr-7">Taille</div>
              <div className="w-32 flex-shrink-0 ml-2">Date d'ajout</div>
              <div className="w-24 flex-shrink-0 ">Ajouté par</div>
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
                <div className="w-20 text-gray-600 flex-shrink-0 text-right ml-2">
                  {formatFileSize(file.fileSize)}
                </div>
                
                {/* Colonne Date d'ajout */}
                <div className="w-32 text-gray-600 flex-shrink-0 ml-2">
                  {formatDate(file.uploadDate)}
                </div>
                
                {/* Colonne Ajouté par */}
                <div className="w-24 text-gray-600 flex-shrink-0 truncate ml-5">
                  {file.uploadedBy}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunitiesPage;
