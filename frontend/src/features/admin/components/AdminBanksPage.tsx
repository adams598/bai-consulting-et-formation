import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Archive, 
  Trash2,
  Users,
  UserPlus,
  Power,
  PowerOff,
  MoreVertical,
  Grid,
  List,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { banksApi } from '../../../api/adminApi';
import { useToast } from '../../../components/ui/use-toast';
import { Bank } from '../types';
import CreateBankModal from './CreateBankModal';
import BankModal from './BankModal';

interface BankWithStats extends Bank {
  userCount?: number;
  formationCount?: number;
}

const AdminBanksPage: React.FC = () => {
  console.log('🔍 AdminBanksPage - Composant rendu');
  
  const [banks, setBanks] = useState<BankWithStats[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<BankWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  // Debug: Log de l'état de la modale
  useEffect(() => {
    console.log('🔍 AdminBanksPage - showCreateModal changed:', showCreateModal);
    console.log('🔍 AdminBanksPage - showEditModal changed:', showEditModal);
    if (showCreateModal) {
      console.log('🎉 AdminBanksPage - MODALE DOIT S\'OUVRIR !');
    }
  }, [showCreateModal, showEditModal]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadBanks();
  }, []);

  useEffect(() => {
    filterBanks();
  }, [banks, searchTerm, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-trigger') && !target.closest('.dropdown-menu')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadBanks = async () => {
    try {
      setIsLoading(true);
      const response = await banksApi.getAll();
      // Normaliser les données pour s'assurer que createdAt est un Date
      const normalizedBanks = (response.data.data || []).map((bank: any) => ({
        ...bank,
        createdAt: bank.createdAt ? new Date(bank.createdAt) : new Date(),
        updatedAt: bank.updatedAt ? new Date(bank.updatedAt) : new Date(),
      }));
      setBanks(normalizedBanks);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les banques",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterBanks = () => {
    let filtered = banks;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(bank => 
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bank => 
        statusFilter === 'active' ? bank.isActive : !bank.isActive
      );
    }

    setFilteredBanks(filtered);
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <div className="flex items-center text-green-600">
        <CheckCircle className="h-4 w-4 mr-1" />
        <span className="text-sm">Active</span>
      </div>
    ) : (
      <div className="flex items-center text-red-600">
        <XCircle className="h-4 w-4 mr-1" />
        <span className="text-sm">Inactive</span>
      </div>
    );
  };

  // Gérer l'édition d'une banque
  const handleEditBank = (bank: Bank) => {
    setEditingBank(bank);
    setShowEditModal(true);
  };

  // Sauvegarder une banque (création ou modification)
  const handleSaveBank = async (data: Partial<Bank>) => {
    try {
      if (editingBank) {
        // Modification
        const response = await banksApi.update(editingBank.id, data);
        if (response.data) {
          toast({
            title: "Succès",
            description: "Banque modifiée avec succès",
          });
          loadBanks();
          setShowEditModal(false);
          setEditingBank(null);
        } else {
          throw new Error('Erreur lors de la modification');
        }
      } else {
        // Création (ne devrait pas arriver avec la nouvelle modale)
        const response = await banksApi.create(data as any);
        if (response.data) {
          toast({
            title: "Succès",
            description: "Banque créée avec succès",
          });
          loadBanks();
          setShowEditModal(false);
        } else {
          throw new Error('Erreur lors de la création');
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de sauvegarder la banque",
        variant: "destructive",
      });
    }
  };

  // Supprimer une banque
  const handleDeleteBank = async (bank: Bank) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la banque "${bank.name}" ?`)) {
      return;
    }

    try {
      const response = await banksApi.delete(bank.id);
      if (response.status === 200) {
        toast({
          title: "Succès",
          description: "Banque supprimée avec succès",
        });
        loadBanks();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de supprimer la banque",
        variant: "destructive",
      });
    }
  };

  // Activer/Désactiver une banque
  const handleToggleBank = async (bank: Bank) => {
    try {
      const response = await banksApi.toggleActive(bank.id);
      if (response.data) {
        toast({
          title: "Succès",
          description: `Banque ${bank.isActive ? 'désactivée' : 'activée'} avec succès`,
        });
        loadBanks();
      } else {
        throw new Error('Erreur lors du changement de statut');
      }
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de changer le statut de la banque",
        variant: "destructive",
      });
    }
  };

  const handleViewBankDetails = (bank: BankWithStats) => {
    console.log('Voir détails:', bank);
    toast({
      title: "Détails",
      description: `Affichage des détails de ${bank.name}`,
    });
  };


  const toggleDropdown = (bankId: string) => {
    setActiveDropdown(activeDropdown === bankId ? null : bankId);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres et vue */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">         
          <div className="flex items-center gap-3">
            {/* Bouton vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
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
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Vue cartes"
              >
                                 <Grid className="h-4 w-4" />
              </button>
            </div>

            {/* Bouton nouvelle banque */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚀 AdminBanksPage - CLIC DÉTECTÉ sur Nouvelle Banque');
                console.log('🚀 AdminBanksPage - showCreateModal avant:', showCreateModal);
                setShowCreateModal(true);
                console.log('🚀 AdminBanksPage - setShowCreateModal(true) appelé');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              style={{ zIndex: 1000 }}
            >
              <Plus className="h-5 w-5" />
              
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher une banque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtre statut */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives uniquement</option>
              <option value="inactive">Inactives uniquement</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          </div>
        </div>

        {/* Compteur */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {filteredBanks.length} banque(s) trouvée(s)
          </span>
          <span className="text-sm text-gray-500">
            {banks.filter(b => b.isActive).length} active(s) / {banks.filter(b => !b.isActive).length} inactive(s)
          </span>
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === 'list' ? (
        /* Vue Liste */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateurs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formations
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
                {filteredBanks.map((bank) => (
                  <tr key={bank.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bank.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.userCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.formationCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusIcon(bank.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(bank.id)}
                          className="dropdown-trigger p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {activeDropdown === bank.id && (
                          <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleViewBankDetails(bank);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4 mr-3" />
                                Voir les détails
                              </button>
                              <button
                                onClick={() => {
                                  handleEditBank(bank);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4 mr-3" />
                                Modifier
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleBank(bank);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {bank.isActive ? (
                                  <>
                                    <PowerOff className="h-4 w-4 mr-3" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-4 w-4 mr-3" />
                                    Activer
                                  </>
                                )}
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  handleDeleteBank(bank);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-3" />
                                Supprimer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vue Cartes */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBanks.map((bank) => (
            <div key={bank.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Building2 className="h-10 w-10 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bank.name}</h3>
                    <p className="text-sm text-gray-500">{bank.code}</p>
                  </div>
                </div>
                
                {/* Menu 3 points */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(bank.id)}
                    className="dropdown-trigger p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  {activeDropdown === bank.id && (
                    <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleViewBankDetails(bank);
                            setActiveDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4 mr-3" />
                          Voir les détails
                        </button>
                        <button
                          onClick={() => {
                            handleEditBank(bank);
                            setActiveDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-3" />
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            handleToggleBank(bank);
                            setActiveDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {bank.isActive ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-3" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-3" />
                              Activer
                            </>
                          )}
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            handleDeleteBank(bank);
                            setActiveDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-3" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statut */}
              <div className="mb-4">
                {getStatusIcon(bank.isActive)}
              </div>

              {/* Statistiques */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Utilisateurs
                  </span>
                  <span className="text-sm font-medium text-gray-900">{bank.userCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Formations</span>
                  <span className="text-sm font-medium text-gray-900">{bank.formationCount || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message si aucune banque */}
      {!isLoading && filteredBanks.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune banque trouvée</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Essayez de modifier vos filtres de recherche.'
              : 'Commencez par créer votre première banque.'
            }
          </p>
        </div>
      )}

      {/* Modales */}
      <CreateBankModal
        isOpen={showCreateModal}
        onClose={() => {
          console.log('❌ AdminBanksPage - Fermeture modale, showCreateModal:', showCreateModal);
          setShowCreateModal(false);
        }}
        onSuccess={() => {
          console.log('✅ AdminBanksPage - Succès création, fermeture modale');
          loadBanks();
          setShowCreateModal(false);
        }}
      />

      <BankModal
        bank={editingBank}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingBank(null);
        }}
        onSave={handleSaveBank}
      />
    </div>
  );
};

export default AdminBanksPage; 