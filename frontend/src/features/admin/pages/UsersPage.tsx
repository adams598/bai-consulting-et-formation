import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, UserRole } from '../types';
import { usersApi } from '../../../api/adminApi';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import { UserModal } from '../components/UserModal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  
  const { toast } = useToast();

  useEffect(() => {
    if (selectedBankId) {
      loadUsers();
    }
  }, [selectedBankId]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole]);

  const loadUsers = async () => {
    if (!selectedBankId) return;
    
    try {
      setIsLoading(true);
      const response = await usersApi.getAll(selectedBankId);
      setUsers(response.data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par rôle
    if (selectedRole !== 'ALL') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await usersApi.delete(id);
        await loadUsers();
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'utilisateur",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await usersApi.toggleActive(id);
      await loadUsers();
      toast({
        title: "Succès",
        description: "Statut de l'utilisateur mis à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      await usersApi.resetPassword(id);
      toast({
        title: "Succès",
        description: "Mot de passe réinitialisé et envoyé par email",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser le mot de passe",
        variant: "destructive",
      });
    }
  };

  const handleSendCredentials = async (id: string) => {
    try {
      await usersApi.sendCredentials(id);
      toast({
        title: "Succès",
        description: "Identifiants envoyés par email",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer les identifiants",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.BANK_ADMIN:
        return 'Admin Banque';
      case UserRole.COLLABORATOR:
        return 'Collaborateur';
      default:
        return 'Inconnu';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.BANK_ADMIN:
        return 'bg-blue-100 text-blue-800';
      case UserRole.COLLABORATOR:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!selectedBankId) {
    return (
      <div className="text-center py-12">
        <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Sélectionnez une banque</h3>
        <p className="mt-1 text-sm text-gray-500">
          Veuillez sélectionner une banque pour gérer ses utilisateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bouton d'action */}
      <div className="flex justify-end">
        <Button onClick={handleCreateUser} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nouvel utilisateur</span>
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
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre par rôle */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole | 'ALL')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tous les rôles</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                <option value={UserRole.BANK_ADMIN}>Admin Banque</option>
                <option value={UserRole.COLLABORATOR}>Collaborateur</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des utilisateurs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Département
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user.id)}
                          >
                            {user.isActive ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user.id)}
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendCredentials(user.id)}
                            title="Envoyer les identifiants"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
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

          {!isLoading && filteredUsers.length === 0 && (
            <div className="p-8 text-center">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par créer votre premier utilisateur.
              </p>
              <div className="mt-6">
                <Button onClick={handleCreateUser}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un utilisateur
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <UserModal
          user={editingUser}
          bankId={selectedBankId}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={async () => {
            await loadUsers();
            setShowModal(false);
            setEditingUser(null);
          }}
        />
      )}
  );
}; 