import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Building2, Plus } from 'lucide-react';
import { Bank, User } from '../types';
import { banksApi, usersApi } from '../../../api/adminApi';
import { useToast } from '../../../components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import UserSelectionModal from './UserSelectionModal';

interface CreateBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserWithBank extends User {
  bank?: Bank;
}

const CreateBankModal: React.FC<CreateBankModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true
  });
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUsersDetails, setSelectedUsersDetails] = useState<UserWithBank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fonction pour générer le code de la banque
  const generateBankCode = (bankName: string): string => {
    if (!bankName.trim()) return '';
    
    // Prendre les 3 premières lettres du nom, en majuscules
    const code = bankName
      .trim()
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 3);
    
    // Ajouter un timestamp pour l'unicité
    const timestamp = Date.now().toString().slice(-4);
    
    return `${code}${timestamp}`;
  };

  // Mettre à jour le code quand le nom change
  const handleNameChange = (name: string) => {
    const newCode = generateBankCode(name);
    setFormData(prev => ({ 
      ...prev, 
      name,
      code: newCode
    }));
  };

  // Gérer la sélection d'utilisateurs depuis la modale
  const handleUserSelection = (selectedUserIds: string[], selectedUsersDetails: UserWithBank[]) => {
    setSelectedUsers(selectedUserIds);
    setSelectedUsersDetails(selectedUsersDetails);
  };

  // Créer la banque
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    await createBank();
  };

  const createBank = async () => {
    try {
      setIsLoading(true);
      
      // Timer pour afficher le loader après 1 seconde
      const loaderTimer = setTimeout(() => {
        setShowLoader(true);
      }, 1000);
      
      // Étape 1: Créer la banque
      const bankResponse = await banksApi.create({
        name: formData.name,
        code: formData.code,
        isActive: formData.isActive
      });

      if (bankResponse.data.success && bankResponse.data.data) {
        const newBank = bankResponse.data.data;
        const idBank = newBank.id; // Récupérer l'ID généré
        
        // Étape 2: Assigner les utilisateurs sélectionnés à la nouvelle banque
        if (selectedUsers.length > 0) {
          console.log('🔄 Assignation de', selectedUsers.length, 'utilisateurs à la banque', idBank);
          for (const userId of selectedUsers) {
            try {
              console.log('📋 Récupération des données de l\'utilisateur:', userId);
              // Récupérer les données de l'utilisateur existant
              const userResponse = await usersApi.getById(userId);
              console.log('📋 Réponse getById:', userResponse);
              
              // Vérifier la structure de la réponse
              console.log('📋 Structure de la réponse:', {
                data: userResponse.data,
                success: userResponse.data?.success,
                hasData: !!userResponse.data?.data,
                directData: userResponse.data
              });
              
              let existingUser;
              if (userResponse.data?.success && userResponse.data.data) {
                existingUser = userResponse.data.data;
              } else if (userResponse.data?.success && userResponse.data) {
                existingUser = userResponse.data;
              } else {
                console.error('❌ Structure de réponse inattendue:', userResponse);
                continue;
              }
              
              console.log('👤 Utilisateur existant:', existingUser);
              
              // Mettre à jour avec les données existantes + nouveau bankId
              const updateData = { 
                ...existingUser,
                bankId: idBank 
              };
              console.log('🔄 Données de mise à jour:', updateData);
              
              const updateResponse = await usersApi.update(userId, updateData);
              console.log('✅ Réponse update:', updateResponse);
            } catch (error) {
              console.error('❌ Erreur lors de la mise à jour de l\'utilisateur', userId, ':', error);
            }
          }
        }

        // Annuler le timer si l'opération se termine avant 1 seconde
        clearTimeout(loaderTimer);
        setShowLoader(false);

        toast({
          title: "Succès",
          description: `Banque "${formData.name}" créée avec succès${selectedUsers.length > 0 ? ` et ${selectedUsers.length} utilisateur(s) assigné(s)` : ''}`,
        });

        onSuccess();
        resetForm();
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la banque:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de créer la banque",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowLoader(false);
    }
  };


  // Rediriger vers la création d'utilisateur
  const handleCreateNewUser = () => {
    navigate('/admin/users');
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      isActive: true
    });
    setSelectedUsers([]);
    setSelectedUsersDetails([]);
    setShowLoader(false);
  };

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Gérer la fermeture avec la touche Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showUserSelection) {
          setShowUserSelection(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, showUserSelection, onClose]);

  console.log('🔍 CreateBankModal - isOpen:', isOpen, 'showUserSelection:', showUserSelection);
  
  if (!isOpen) {
    console.log('🔍 CreateBankModal - Pas de rendu car isOpen = false');
    return null;
  }

  console.log('🔍 CreateBankModal - Rendu de la modale');

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{ zIndex: 9999 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            console.log('CreateBankModal - Fermeture via clic overlay');
            onClose();
          }
        }}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Créer une nouvelle banque
            </h2>
            <div className="flex items-center gap-2">
             
              <button
                onClick={() => {
                  console.log('CreateBankModal - Fermeture via X');
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Informations de la banque */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Informations de la banque</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la banque *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom de la banque"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de la banque *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="Code généré automatiquement"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le code est généré automatiquement à partir du nom de la banque
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Banque active
                </label>
              </div>
            </div>

            {/* Sélection des utilisateurs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ajouter des utilisateurs
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUserSelection(true)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewUser}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Nouvel utilisateur
                  </button>
                </div>
              </div>

              {/* Liste des utilisateurs sélectionnés */}
              {selectedUsers.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Utilisateurs sélectionnés ({selectedUsers.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedUsersDetails.map((user) => (
                      <div key={user.id} className="flex items-center justify-between bg-white rounded-md p-2 border border-blue-200">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email} • {user.role}
                          </div>
                          {user.bank && (
                            <div className="text-xs text-orange-600">
                              Actuellement dans: {user.bank.name}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const newSelectedUsers = selectedUsers.filter(id => id !== user.id);
                            const newSelectedUsersDetails = selectedUsersDetails.filter(u => u.id !== user.id);
                            setSelectedUsers(newSelectedUsers);
                            setSelectedUsersDetails(newSelectedUsersDetails);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Aucun utilisateur sélectionné. Cliquez sur "Ajouter" pour sélectionner des utilisateurs.
                  </p>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  console.log('CreateBankModal - Fermeture via Annuler');
                  onClose();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isLoading ? 'Création...' : 'Créer la banque'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de sélection d'utilisateurs */}
      <UserSelectionModal
        isOpen={showUserSelection}
        onClose={() => setShowUserSelection(false)}
        onConfirm={handleUserSelection}
        title="Sélectionner des utilisateurs pour la banque"
      />

      {/* Loader global */}
      {showLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Création de la banque en cours...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateBankModal;
