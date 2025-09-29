import React, { useState, useEffect } from 'react';
import { X, Users, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { User, Bank } from '../types';
import { usersApi } from '../../../api/adminApi';
import { useToast } from '../../../components/ui/use-toast';

interface UserWithBank extends User {
  bank?: Bank;
}

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedUserIds: string[], selectedUsersDetails: UserWithBank[]) => void;
  title?: string;
}

const UserSelectionModal: React.FC<UserSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Sélectionner des utilisateurs" 
}) => {
  const [users, setUsers] = useState<UserWithBank[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usersToMigrate, setUsersToMigrate] = useState<{ userId: string; currentBankName: string }[]>([]);
  
  const { toast } = useToast();

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getAllUsers();
      if (response.data?.success) {
        setUsers(response.data.data || []);
      } else {
        throw new Error('Erreur lors du chargement des utilisateurs');
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

  // Gérer la sélection d'utilisateurs
  const handleUserSelection = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
      
      // Si l'utilisateur a déjà une banque, l'ajouter à la liste de migration
      const user = users.find(u => u.id === userId);
      if (user?.bankId && user.bank) {
        setUsersToMigrate(prev => [...prev, { 
          userId, 
          currentBankName: user.bank.name 
        }]);
      }
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      setUsersToMigrate(prev => prev.filter(u => u.userId !== userId));
    }
  };

  // Confirmer la sélection
  const handleConfirm = () => {
    const selectedUsersDetails = users.filter(user => selectedUsers.includes(user.id));
    onConfirm(selectedUsers, selectedUsersDetails);
    onClose();
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setSelectedUsers([]);
    setUsersToMigrate([]);
    setSearchTerm('');
  };

  // Charger les utilisateurs à l'ouverture
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    } else {
      resetForm();
    }
  }, [isOpen]);

  // Gérer la fermeture avec la touche Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Séparer les utilisateurs par catégorie
  const usersWithoutBank = filteredUsers.filter(user => !user.bankId);
  const usersWithBank = filteredUsers.filter(user => user.bankId);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Avertissement migration */}
          {usersToMigrate.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Migration d'utilisateurs requise
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {usersToMigrate.length} utilisateur(s) seront migré(s) depuis leur banque actuelle :
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                    {usersToMigrate.map((migration) => (
                      <li key={migration.userId}>
                        {users.find(u => u.id === migration.userId)?.firstName} {users.find(u => u.id === migration.userId)?.lastName} 
                        {' '}({migration.currentBankName})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Liste des utilisateurs */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Chargement des utilisateurs...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Utilisateurs sans banque */}
              {usersWithoutBank.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Utilisateurs sans banque ({usersWithoutBank.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                    {usersWithoutBank.map((user) => (
                      <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">({user.email})</span>
                        </div>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Sans banque
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Utilisateurs avec banque */}
              {usersWithBank.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Utilisateurs avec banque ({usersWithBank.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                    {usersWithBank.map((user) => (
                      <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">({user.email})</span>
                        </div>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {user.bank?.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {filteredUsers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucun utilisateur trouvé
                </p>
              )}
            </div>
          )}

          {/* Compteur de sélection */}
          {selectedUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            disabled={selectedUsers.length === 0}
          >
            Ajouter ({selectedUsers.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSelectionModal;
