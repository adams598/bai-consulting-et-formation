import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Users, Plus, Edit, Trash2, UserCheck, UserX, Search } from 'lucide-react';
import { Formation, Bank } from '../types';
import { bankFormationApi, banksApi } from '../../../api/adminApi';
import ConfirmModal from './ConfirmModal';
import '../styles/admin-typography.css';

// Interface étendue pour les banques avec statistiques
interface BankWithStats extends Bank {
  userCount?: number;
  activeUserCount?: number;
}

interface BanksListViewProps {
  formation: Formation;
  formationStats?: { bankCount: number; userCount: number };
  onBack: () => void;
}

const BanksListView: React.FC<BanksListViewProps> = ({
  formation,
  formationStats,
  onBack
}) => {
  const [banks, setBanks] = useState<BankWithStats[]>([]);
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankWithStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);

  useEffect(() => {
    loadBanks();
  }, [formation.id]);

  useEffect(() => {
    // Filtrer les banques selon le terme de recherche
    if (searchTerm.trim()) {
      const filtered = allBanks.filter(bank =>
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBanks(filtered);
    } else {
      setFilteredBanks(allBanks);
    }
  }, [searchTerm, allBanks]);

  const loadBanks = async () => {
    try {
      setIsLoading(true);
      
      // Charger les banques assignées à la formation
      const banksResponse = await bankFormationApi.getFormationBanks(formation.id);
      if (banksResponse.success) {
        // Ajouter des statistiques fictives pour la démonstration
        const banksWithStats = (banksResponse.data || []).map(bank => ({
          ...bank,
          userCount: Math.floor(Math.random() * 50) + 10, // 10-60 utilisateurs
          activeUserCount: Math.floor(Math.random() * 30) + 5 // 5-35 utilisateurs actifs
        }));
        setBanks(banksWithStats);
      }
      
      // Charger toutes les banques disponibles pour l'assignation
      const allBanksResponse = await banksApi.getAll();
      if (allBanksResponse.data?.success) {
        setAllBanks(allBanksResponse.data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des banques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignBank = async (bankId: string) => {
    try {
      const response = await bankFormationApi.assignFormationToBank({
        bankId,
        formationId: formation.id
      });
      
      if (response.success) {
        // Recharger la liste des banques
        await loadBanks();
        setShowAssignModal(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation de la banque:', error);
    }
  };

  const handleRemoveBank = (bank: Bank) => {
    setSelectedBank(bank);
    setShowConfirmModal(true);
  };

  const handleRemoveBankConfirm = async () => {
    if (selectedBank) {
      try {
        // Récupérer l'ID de l'assignation banque-formation
        const bankFormation = banks.find(b => b.id === selectedBank.id);
        if (bankFormation) {
          // TODO: Implémenter la suppression via l'API
          // await bankFormationApi.removeFormationFromBank(bankFormation.id);
          
          // Pour l'instant, on retire de la liste locale
          setBanks(banks.filter(b => b.id !== selectedBank.id));
        }
        setShowConfirmModal(false);
        setSelectedBank(null);
      } catch (error) {
        console.error('Erreur lors de la suppression de la banque:', error);
      }
    }
  };

  const handleToggleBankActive = async (bank: Bank) => {
    try {
      const response = await banksApi.toggleActive(bank.id);
      if (response.data) {
        // Mettre à jour la liste locale
        setBanks(banks.map(b => 
          b.id === bank.id 
            ? { ...b, isActive: !b.isActive }
            : b
        ));
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut de la banque:', error);
    }
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
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour aux formations
        </button>
        
        <button
          onClick={() => setShowAssignModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assigner une banque
        </button>
      </div>

      {/* Informations de la formation */}
      {/* <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Banques assignées à "{formation.title}"
        </h1>
        <p className="text-gray-600">
          Gérez les banques qui ont accès à cette formation
        </p>
      </div> */}

      {/* Liste des banques */}
      <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
                  <h2 className="admin-title-md admin-title-spacing">Banques assignées</h2>
        <span className="admin-text-sm admin-badge">{banks.length} banque(s)</span>
        </div>

        {banks.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune banque assignée</p>
            <p className="text-gray-400">Commencez par assigner une banque à cette formation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {banks.map((bank) => (
              <div key={bank.id} className="bg-gradient-to-b from-white to-blue-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="admin-card-title admin-title-spacing">{bank.name}</h3>
                      <p className="admin-text-sm admin-badge">Code: {bank.code}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{bank.userCount || 0} utilisateur(s)</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <UserCheck className="h-4 w-4 mr-2" />
                          <span>{bank.activeUserCount || 0} actif(s)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleBankActive(bank)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        bank.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {bank.isActive ? 'Active' : 'Inactive'}
                    </button>
                    
                    <button
                      onClick={() => handleRemoveBank(bank)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Retirer la banque"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="admin-stat-label">Total banques</p>
              <p className="admin-stat-number">{banks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="admin-stat-label">Utilisateurs actifs</p>
              <p className="admin-stat-number">
                {banks.reduce((total, bank) => total + (bank.activeUserCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="admin-stat-label">Total utilisateurs</p>
              <p className="admin-stat-number">
                {banks.reduce((total, bank) => total + (bank.userCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'assignation de banque */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="admin-modal-title admin-title-spacing">Assigner une banque à la formation</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une banque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Liste des banques disponibles */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredBanks
                .filter(bank => !banks.some(assignedBank => assignedBank.id === bank.id))
                .map(bank => (
                  <div key={bank.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="admin-card-title admin-title-spacing">{bank.name}</p>
                        <p className="admin-text-sm admin-badge">Code: {bank.code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignBank(bank.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      Assigner
                    </button>
                  </div>
                ))}
            </div>

            {filteredBanks.filter(bank => !banks.some(assignedBank => assignedBank.id === bank.id)).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune banque disponible pour l'assignation
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showConfirmModal && (
        <ConfirmModal
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleRemoveBankConfirm}
          title="Retirer la banque"
          message={`Êtes-vous sûr de vouloir retirer la banque "${selectedBank?.name}" de cette formation ?`}
        />
      )}
    </div>
  );
};

export default BanksListView;
