import React, { useState, useEffect } from 'react';
import { Plus, Edit, Archive, Eye, Users, BookOpen, Building2 } from 'lucide-react';
import { banksApi } from '../../../api/adminApi';
import { Bank } from '../types';
import BankModal from './BankModal';
import ConfirmModal from './ConfirmModal';

const AdminBanksPage: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [action, setAction] = useState<'edit' | 'archive' | null>(null);

  useEffect(() => {
    loadBanks();
  }, []);

  useEffect(() => {
    filterBanks();
  }, [banks, searchTerm]);

  const loadBanks = async () => {
    try {
      setIsLoading(true);
      const response = await banksApi.getAll();
      setBanks(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des banques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBanks = () => {
    if (!searchTerm.trim()) {
      setFilteredBanks(banks);
    } else {
      const filtered = banks.filter(bank =>
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBanks(filtered);
    }
  };

  const handleCreateBank = () => {
    setSelectedBank(null);
    setAction('edit');
    setShowBankModal(true);
  };

  const handleEditBank = (bank: Bank) => {
    setSelectedBank(bank);
    setAction('edit');
    setShowBankModal(true);
  };

  const handleArchiveBank = (bank: Bank) => {
    setSelectedBank(bank);
    setAction('archive');
    setShowConfirmModal(true);
  };

  const handleViewBankDetails = (bank: Bank) => {
    // Navigation vers la vue détaillée de la banque
    window.location.href = `/admin/banks/${bank.id}`;
  };

  const handleSaveBank = async (bankData: Partial<Bank>) => {
    try {
      if (selectedBank) {
        await banksApi.update(selectedBank.id, bankData);
      } else {
        await banksApi.create(bankData);
      }
      setShowBankModal(false);
      loadBanks();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleArchiveConfirm = async () => {
    if (selectedBank) {
      try {
        await banksApi.archive(selectedBank.id);
        setShowConfirmModal(false);
        loadBanks();
      } catch (error) {
        console.error('Erreur lors de l\'archivage:', error);
      }
    }
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Banques</h1>
        <button
          onClick={handleCreateBank}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nouvelle Banque
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher une banque..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Liste des banques */}
      <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Banques</h2>
          <span className="text-sm text-gray-500">{filteredBanks.length} banque(s)</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
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
                {(filteredBanks || []).map((bank) => (
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewBankDetails(bank)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditBank(bank)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleArchiveBank(bank)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Archiver"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showBankModal && (
        <BankModal
          bank={selectedBank}
          onClose={() => setShowBankModal(false)}
          onSave={handleSaveBank}
        />
      )}

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <ConfirmModal
          title="Archiver la banque"
          message={`Êtes-vous sûr de vouloir archiver la banque "${selectedBank?.name}" ?`}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setShowConfirmModal(false)}
          confirmText="Archiver"
          variant="danger"
        />
      )}
    </div>
  );
};

export default AdminBanksPage; 