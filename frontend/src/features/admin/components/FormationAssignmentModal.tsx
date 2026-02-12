import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Users, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { useConfirmation } from '../../../hooks/useConfirmation';
import { Formation, User, Bank, UserFormationAssignment } from '../types';
import { banksApi, usersApi, assignmentsApi } from '../../../api/adminApi';

interface FormationAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formation?: Formation;
  formationIds?: string[];
  onSave: (assignments: Partial<UserFormationAssignment>[]) => void;
}

const FormationAssignmentModal: React.FC<FormationAssignmentModalProps> = ({
  isOpen,
  onClose,
  formation,
  onSave
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState<Partial<UserFormationAssignment>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<Record<string, string>>({});
  const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
  
  // Hook de confirmation
  const confirmation = useConfirmation();

  // Configuration simple pour les nouvelles attributions
  const [globalDueDate, setGlobalDueDate] = useState('');
  const [globalIsMandatory, setGlobalIsMandatory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBanks();
      loadAssignedUsers();
      // Réinitialiser l'état quand le modal s'ouvre
      setSelectedBank('');
      setUsers([]);
      setAssignments([]);
      setSearchTerm('');
      setGlobalDueDate('');
      setGlobalIsMandatory(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedBank) {
      loadUsers();
    }
  }, [selectedBank]);

  const loadBanks = async () => {
    try {
      setLoadingBanks(true);
      // console.log('🏦 Chargement des banques...');
      const response = await banksApi.getAll();
      // console.log('🏦 Réponse banques:', response);
      
      if (response.data.success && response.data.data) {
        // Filtrer les banques actives
        const activeBanks = response.data.data.filter(bank => bank.isActive);
        setBanks(activeBanks);
        // console.log('✅ Banques actives chargées:', activeBanks);
      } else {
        console.error('❌ Erreur dans la réponse banques:', response.data);
        // Fallback avec des données de test si pas de banques
        setBanks([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des banques:', error);
      // En cas d'erreur, utiliser des données de test pour le développement
      // console.log('🧪 Utilisation des données de test...');
      setBanks([
        {
          id: 'test-bank-1',
          name: 'Banque Test 1',
          code: 'TEST1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-bank-2', 
          name: 'Banque Test 2',
          code: 'TEST2',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    } finally {
      setLoadingBanks(false);
    }
  };

  const loadUsers = async () => {
    if (!selectedBank) return;
    
    try {
      setLoadingUsers(true);
      // console.log('👥 Chargement des utilisateurs pour la banque:', selectedBank);
      const response = await usersApi.getAll(selectedBank);
      // console.log('👥 Réponse utilisateurs:', response);
      
      if (response.data.success && response.data.data) {
        setUsers(response.data.data);
        // console.log('✅ Utilisateurs chargés:', response.data.data);
      } else {
        console.error('❌ Erreur dans la réponse utilisateurs:', response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
      // En cas d'erreur, utiliser des données de test pour le développement
      // console.log('🧪 Utilisation des utilisateurs de test...');
      setUsers([
        {
          id: 'test-user-1',
          email: 'jean.dupont@test.com',
          firstName: 'Jean',
          lastName: 'Dupont',
          role: 'COLLABORATOR',
          bankId: selectedBank,
          department: 'Commercial',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-user-2',
          email: 'marie.martin@test.com', 
          firstName: 'Marie',
          lastName: 'Martin',
          role: 'COLLABORATOR',
          bankId: selectedBank,
          department: 'Marketing',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-user-3',
          email: 'pierre.bernard@test.com',
          firstName: 'Pierre', 
          lastName: 'Bernard',
          role: 'COLLABORATOR',
          bankId: selectedBank,
          department: 'IT',
          isActive: false, // Utilisateur inactif pour tester
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAssignedUsers = async () => {
    if (!formation?.id) {
      setAssignedUsers({});
      return;
    }

    try {
      setLoadingAssignedUsers(true);
      const response = await assignmentsApi.getByFormation(formation.id);
      const data = response.data?.data || [];
      const map: Record<string, string> = {};
      data.forEach((assignment: any) => {
        if (assignment.user?.id) {
          map[assignment.user.id] = assignment.id;
        }
      });
      setAssignedUsers(map);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des assignations:', error);
      setAssignedUsers({});
    } finally {
      setLoadingAssignedUsers(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addUserToAssignments = (user: User) => {
    if (assignedUsers[user.id]) {
      return;
    }
    // Vérifier si l'utilisateur n'est pas déjà assigné
    if (assignments.some(a => a.userId === user.id)) {
      return;
    }

    const newAssignment: Partial<UserFormationAssignment> = {
      userId: user.id,
      isMandatory: globalIsMandatory,
      dueDate: globalDueDate || undefined,
      assignedAt: new Date().toISOString(),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        isActive: user.isActive
      }
    };

    setAssignments(prev => [...prev, newAssignment]);
  };

  const removeAssignment = (userId: string) => {
    setAssignments(prev => prev.filter(a => a.userId !== userId));
  };

  const handleUnassignUser = async (userId: string) => {
    const assignmentId = assignedUsers[userId];
    if (!assignmentId) return;

    try {
      await assignmentsApi.delete(assignmentId);
      setAssignedUsers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (error) {
      console.error('❌ Erreur lors de la désassignation:', error);
    }
  };

  const updateAssignment = (userId: string, field: keyof UserFormationAssignment, value: any) => {
    setAssignments(prev => prev.map(a =>
      a.userId === userId ? { ...a, [field]: value } : a
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (assignments.length === 0) {
      confirmation.showConfirmation({
        title: 'Aucun utilisateur sélectionné',
        message: 'Veuillez sélectionner au moins un utilisateur avant de sauvegarder les attributions.',
        confirmText: 'Compris',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSave(assignments);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAllFilteredUsers = () => {
    // Ne sélectionner que les utilisateurs actifs
    filteredUsers
      .filter(user => user.isActive && !assignments.some(a => a.userId === user.id) && !assignedUsers[user.id])
      .forEach(user => addUserToAssignments(user));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {formation
              ? `Attribuer la formation : ${formation.title}`
              : `Attribuer ${formationIds?.length || 0} formation(s)`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sélection des utilisateurs */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Sélectionner les utilisateurs
              </h3>

              {/* Configuration globale simplifiée */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                <h4 className="text-sm font-medium text-blue-900">Configuration pour tous les utilisateurs sélectionnés</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date limite (optionnel)
                    </label>
                    <input
                      type="date"
                      value={globalDueDate}
                      onChange={(e) => setGlobalDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Aucune date limite"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="globalMandatory"
                        checked={globalIsMandatory}
                        onChange={(e) => setGlobalIsMandatory(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="globalMandatory" className="text-sm text-gray-700">
                        Formation obligatoire
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    Ces paramètres seront appliqués aux nouveaux utilisateurs sélectionnés.
                  </p>
                  {assignments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignments(prev => prev.map(assignment => ({
                          ...assignment,
                          dueDate: globalDueDate || undefined,
                          isMandatory: globalIsMandatory
                        })));
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Appliquer à tous ({assignments.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Sélection de banque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banque
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => {
                    setSelectedBank(e.target.value);
                    // Reset des utilisateurs et assignments quand on change de banque
                    setUsers([]);
                    setAssignments([]);
                    setSearchTerm('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loadingBanks}
                >
                  <option value="">
                    {loadingBanks ? 'Chargement...' : 'Sélectionner une banque'}
                  </option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} ({bank.code})
                    </option>
                  ))}
                </select>
                {loadingBanks && (
                  <p className="text-sm text-gray-500 mt-1">Chargement des banques...</p>
                )}
              </div>

              {selectedBank && (
                <>
                  {/* Recherche d'utilisateurs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rechercher des utilisateurs
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nom, prénom ou email..."
                      />
                    </div>
                  </div>

                  {/* Liste des utilisateurs */}
                  <div className="border border-gray-200 rounded-md">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        Utilisateurs disponibles ({filteredUsers.length})
                      </span>
                      {(() => {
                        const availableUsers = filteredUsers.filter(user => 
                          user.isActive && !assignments.some(a => a.userId === user.id) && !assignedUsers[user.id]
                        );
                        return availableUsers.length > 0 && (
                          <button
                            type="button"
                            onClick={addAllFilteredUsers}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Sélectionner tout ({availableUsers.length})
                          </button>
                        );
                      })()}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {loadingUsers ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          Chargement des utilisateurs...
                        </div>
                      ) : users.length === 0 && selectedBank ? (
                        <div className="p-4 text-center text-gray-500">
                          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p>Aucun utilisateur dans cette banque</p>
                          <p className="text-xs text-gray-400 mt-1">Vérifiez que des collaborateurs sont créés pour cette banque</p>
                        </div>
                      ) : filteredUsers.length === 0 && searchTerm ? (
                        <div className="p-4 text-center text-gray-500">
                          <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p>Aucun utilisateur trouvé pour "{searchTerm}"</p>
                          <p className="text-xs text-gray-400 mt-1">Essayez avec un autre terme de recherche</p>
                        </div>
                      ) : (
                        filteredUsers.map(user => {
                          const isAssigned = assignments.some(a => a.userId === user.id);
                          const isAlreadyAssigned = Boolean(assignedUsers[user.id]);
                          return (
                            <div
                              key={user.id}
                              className={`p-3 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors ${
                                isAssigned ? 'bg-blue-50 border-blue-200' : ''
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <div className="font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  {isAlreadyAssigned && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                                      Deja assignee
                                    </span>
                                  )}
                                  {!user.isActive && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                      Inactif
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                  {user.department && ` • ${user.department}`}
                                </div>
                              </div>
                              {isAlreadyAssigned ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnassignUser(user.id)}
                                  disabled={loadingAssignedUsers}
                                  className="px-3 py-1 rounded text-sm transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                                  title="Desassigner cet utilisateur"
                                >
                                  Desassigner
                                </button>
                              ) : (
                              <button
                                type="button"
                                onClick={() => addUserToAssignments(user)}
                                disabled={isAssigned || !user.isActive}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                  isAssigned
                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                    : !user.isActive
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                                title={
                                  isAssigned ? 'Utilisateur déjà sélectionné' :
                                  !user.isActive ? 'Utilisateur inactif' :
                                  'Sélectionner cet utilisateur'
                                }
                              >
                                {isAssigned ? '✓ Sélectionné' : 'Sélectionner'}
                              </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Utilisateurs sélectionnés */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Utilisateurs sélectionnés ({assignments.length})
              </h3>

              {assignments.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Aucun utilisateur sélectionné
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Sélectionnez des utilisateurs dans la liste de gauche
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.userId}
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {assignment.user?.firstName} {assignment.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.user?.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAssignment(assignment.userId!)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Retirer l'attribution"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Date limite (optionnel)
                          </label>
                          <input
                            type="date"
                            value={assignment.dueDate?.split('T')[0] || ''}
                            onChange={(e) => updateAssignment(assignment.userId!, 'dueDate', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Aucune date limite"
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`mandatory-${assignment.userId}`}
                              checked={assignment.isMandatory}
                              onChange={(e) => updateAssignment(assignment.userId!, 'isMandatory', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`mandatory-${assignment.userId}`} className="text-xs text-gray-700">
                              Formation obligatoire
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || assignments.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Attribution...' : `Attribuer à ${assignments.length} utilisateur(s)`}
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={confirmation.hideConfirmation}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmText={confirmation.options?.confirmText}
        cancelText={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        isLoading={confirmation.isLoading}
      />
    </div>
  );
};

export default FormationAssignmentModal;