import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Play, 
  Pause,
  BookOpen,
  Video,
  FileText,
  Layers
} from 'lucide-react';
import { Formation, FormationType } from '../types';
import { formationsApi } from '../../../api/adminApi';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import { FormationModal } from '../components/FormationModal';

export const FormationsPage: React.FC = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<FormationType | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadFormations();
  }, []);

  useEffect(() => {
    filterFormations();
  }, [formations, searchTerm, selectedType]);

  const loadFormations = async () => {
    try {
      setIsLoading(true);
      
      // Données de test pour le développement
      const mockFormations = [
        {
          id: '1',
          title: 'Gestion des risques bancaires',
          description: 'Formation complète sur la gestion des risques dans le secteur bancaire',
          type: 'VIDEO' as FormationType,
          duration: 120,
          isActive: true,
          isMandatory: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin-1'
        },
        {
          id: '2',
          title: 'Compliance bancaire',
          description: 'Formation sur les règles de conformité et les bonnes pratiques',
          type: 'SLIDES' as FormationType,
          duration: 90,
          isActive: true,
          isMandatory: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          createdBy: 'admin-1'
        },
        {
          id: '3',
          title: 'Relation client avancée',
          description: 'Techniques avancées de relation client et de vente',
          type: 'DOCUMENT' as FormationType,
          duration: 60,
          isActive: true,
          isMandatory: false,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
          createdBy: 'admin-1'
        }
      ];
      
      setFormations(mockFormations);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les formations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterFormations = () => {
    let filtered = formations;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(formation =>
        formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type
    if (selectedType !== 'ALL') {
      filtered = filtered.filter(formation => formation.type === selectedType);
    }

    setFilteredFormations(filtered);
  };

  const handleCreateFormation = () => {
    setEditingFormation(null);
    setShowModal(true);
  };

  const handleEditFormation = (formation: Formation) => {
    setEditingFormation(formation);
    setShowModal(true);
  };

  const handleDeleteFormation = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      try {
        // Simulation de suppression pour le développement
        setFormations(prev => prev.filter(f => f.id !== id));
        toast({
          title: "Succès",
          description: "Formation supprimée avec succès",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la formation",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      // Simulation de modification pour le développement
      setFormations(prev => prev.map(f => 
        f.id === id ? { ...f, isActive: !f.isActive } : f
      ));
      toast({
        title: "Succès",
        description: "Statut de la formation mis à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const handleToggleMandatory = async (id: string) => {
    try {
      // Simulation de modification pour le développement
      setFormations(prev => prev.map(f => 
        f.id === id ? { ...f, isMandatory: !f.isMandatory } : f
      ));
      toast({
        title: "Succès",
        description: "Statut obligatoire mis à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut obligatoire",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: FormationType) => {
    switch (type) {
      case FormationType.VIDEO:
        return <Video className="w-4 h-4" />;
      case FormationType.SLIDES:
        return <Layers className="w-4 h-4" />;
      case FormationType.DOCUMENT:
        return <FileText className="w-4 h-4" />;
      case FormationType.MIXED:
        return <BookOpen className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: FormationType) => {
    switch (type) {
      case FormationType.VIDEO:
        return 'Vidéo';
      case FormationType.SLIDES:
        return 'Diapositives';
      case FormationType.DOCUMENT:
        return 'Document';
      case FormationType.MIXED:
        return 'Mixte';
      default:
        return 'Inconnu';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Formations</h1>
            <p className="text-gray-600">Gérez vos formations et leur contenu</p>
          </div>
          <Button onClick={handleCreateFormation} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nouvelle formation</span>
          </Button>
        </div>

        {/* Filtres */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher une formation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre par type */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as FormationType | 'ALL')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tous les types</option>
                <option value={FormationType.VIDEO}>Vidéo</option>
                <option value={FormationType.SLIDES}>Diapositives</option>
                <option value={FormationType.DOCUMENT}>Document</option>
                <option value={FormationType.MIXED}>Mixte</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des formations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des formations...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Formation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durée
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
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              {getTypeIcon(formation.type)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formation.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formation.description.substring(0, 100)}
                              {formation.description.length > 100 && '...'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getTypeLabel(formation.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(formation.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              formation.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {formation.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {formation.isMandatory && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Obligatoire
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditFormation(formation)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(formation.id)}
                          >
                            {formation.isActive ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleMandatory(formation.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFormation(formation.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredFormations.length === 0 && (
            <div className="p-8 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune formation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par créer votre première formation.
              </p>
              <div className="mt-6">
                <Button onClick={handleCreateFormation}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une formation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <FormationModal
          formation={editingFormation}
          onClose={() => {
            setShowModal(false);
            setEditingFormation(null);
          }}
          onSave={async () => {
            await loadFormations();
            setShowModal(false);
            setEditingFormation(null);
          }}
        />
      )}
    </AdminLayout>
  );
}; 
      )}
    </AdminLayout>
  );
}; 