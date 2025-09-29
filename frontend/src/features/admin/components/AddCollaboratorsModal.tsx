import React, { useState, useEffect } from 'react';
import { X, Search, Users, UserPlus, Check, XCircle } from 'lucide-react';
import { User, Bank } from '../types';
import { usersApi } from '../../../api/adminApi';
import { useToast } from '../../../components/ui/use-toast';

interface AddCollaboratorsModalProps {
  bank: Bank;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCollaboratorsModal: React.FC<AddCollaboratorsModalProps> = ({
  bank,
  onClose,
  onSuccess
}) => {
  const [unassignedUsers, setUnassignedUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const { toast } = useToast();

  // Charger les utilisateurs sans banque
  const loadUnassignedUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.getAll();
      if (response.data?.data) {
        // Filtrer les utilisateurs sans banque
        const usersWithoutBank = response.data.data.filter(user => !user.bankId);
        setUnassignedUsers(usersWithoutBank);
        setFilteredUsers(usersWithoutBank);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les utilisateurs selon la recherche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(unassignedUsers);
    } else {
      const filtered = unassignedUsers.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, unassignedUsers]);

  // Charger les utilisateurs au montage
  useEffect(() => {
    loadUnassignedUsers();
  }, []);

  // Gérer la sélection d'un utilisateur
  const handleUserSelection = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Sélectionner/désélectionner tous les utilisateurs visibles
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
    setSelectAll(!selectAll);
  };

  // Assigner les utilisateurs sélectionnés à la banque
  const handleAssignUsers = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Aucun utilisateur sélectionné",
        description: "Veuillez sélectionner au moins un utilisateur à assigner",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    try {
      // Assigner chaque utilisateur à la banque
      for (const userId of selectedUsers) {
        await usersApi.update(userId, { bankId: bank.id });
      }

      toast({
        title: "Collaborateurs assignés",
        description: `${selectedUsers.length} collaborateur(s) assigné(s) à la banque "${bank.name}"`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de l\'assignation des collaborateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner les collaborateurs à la banque",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Ajouter des collaborateurs
              </h2>
              <p className="text-sm text-gray-500">
                Banque: {bank.name} ({bank.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Barre de recherche */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher un collaborateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions de sélection */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Sélectionner tout ({filteredUsers.length})
                </span>
              </label>
              {selectedUsers.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedUsers.length} sélectionné(s)
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {unassignedUsers.length} collaborateur(s) sans banque
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Users className="h-8 w-8 mb-2" />
                <p className="text-sm">
                  {searchTerm ? 'Aucun collaborateur trouvé' : 'Aucun collaborateur sans banque'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 hover:bg-gray-50 flex items-center space-x-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                            {user.department && (
                              <span className="text-xs text-gray-500">
                                {user.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Annuler
          </button>
          <button
            onClick={handleAssignUsers}
            disabled={selectedUsers.length === 0 || isAssigning}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isAssigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Assignation...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Assigner ({selectedUsers.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCollaboratorsModal;
