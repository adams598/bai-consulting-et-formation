import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, User, Mail, Building, Shield, Clock } from 'lucide-react';
import { User as UserType } from '../types';
import { usersApi } from '../../../api/adminApi';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';

// Type pour la création d'utilisateur avec mot de passe
type CreateUserData = Omit<UserType, 'id' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

interface UserModalProps {
  user?: UserType | null;
  onClose: () => void;
  onSave: (data: Partial<UserType>) => void;
  isLoading: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || 'COLLABORATOR',
    department: user?.department || '',
    phone: user?.phone || '',
    isActive: user?.isActive ?? true
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department || '',
        phone: user.phone || '',
        isActive: user.isActive
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {user ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Prénom"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Nom"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemple.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="COLLABORATOR">Collaborateur</option>
                <option value="BANK_ADMIN">Administrateur de banque</option>
                <option value="SUPER_ADMIN">Super administrateur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Département
              </label>
              <Input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Département"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+33 1 23 45 67 89"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Utilisateur actif
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Enregistrement...' : (user ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [bankFilter, setBankFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getAll(''); // Pas de bankId pour l'instant
      const usersData = Array.isArray(response.data?.data) ? response.data.data : 
                       Array.isArray(response.data) ? response.data : [];
      
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('loadUsers - error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les utilisateurs
  useEffect(() => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    const filtered = users.filter(user => {
      // Filtre de recherche textuelle
      const matchesSearch = 
        (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.bank?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      // Filtre par rôle
      const matchesRole = !roleFilter || user.role === roleFilter;

      // Filtre par banque
      const matchesBank = !bankFilter || user.bankId === bankFilter;

      // Filtre par statut
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesBank && matchesStatus;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, bankFilter, statusFilter]);

  // Charger les données au montage
  useEffect(() => {
    loadUsers();
  }, []);

  // Sauvegarder un utilisateur
  const handleSaveUser = async (data: Partial<UserType>) => {
    try {
      setIsSaving(true);
      
      if (editingUser) {
        await usersApi.update(editingUser.id, data);
        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès",
        });
      } else {
        // Pour la création, s'assurer que les champs obligatoires sont présents
        const createData: CreateUserData = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          role: data.role || 'COLLABORATOR',
          department: data.department || '',
          phone: data.phone || '',
          isActive: data.isActive ?? true,
          password: 'tempPassword123' // Mot de passe temporaire par défaut
        };
        await usersApi.create(createData);
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès",
        });
      }
      
      // Rafraîchir les données
      await loadUsers();
      
      setShowModal(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (user: UserType) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.firstName} ${user.lastName}" ?`)) {
      return;
    }

    try {
      await usersApi.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  // Ouvrir le modal d'édition
  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setShowModal(true);
  };

  // Ouvrir le modal de création
  const handleCreateUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Collaborateurs</h2>
          <p className="text-gray-600">Gérez les collaborateurs de votre plateforme</p>
        </div>
        <Button
          onClick={handleCreateUser}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Collaborateur
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche textuelle */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtre par rôle */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les rôles</option>
            <option value="COLLABORATOR">Collaborateur</option>
            <option value="BANK_ADMIN">Administrateur de banque</option>
            <option value="SUPER_ADMIN">Super administrateur</option>
          </select>

          {/* Filtre par banque */}
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les banques</option>
            {Array.isArray(users) && Array.from(new Set(users.map(u => u.bankId).filter(Boolean))).map(bankId => {
              const user = users.find(u => u.bankId === bankId);
              return (
                <option key={bankId} value={bankId}>
                  {user?.bank?.name || `Banque ${bankId}`}
                </option>
              );
            })}
          </select>

          {/* Filtre par statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        {/* Bouton de réinitialisation des filtres */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('');
              setBankFilter('');
              setStatusFilter('');
            }}
            className="text-sm"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <User className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Collaborateurs</p>
              <p className="text-2xl font-bold text-gray-900">{Array.isArray(users) ? users.length : 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Administrateurs</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(users) ? users.filter(u => u.role === 'BANK_ADMIN' || u.role === 'SUPER_ADMIN').length : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(users) ? users.filter(u => u.isActive).length : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Banques</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(users) ? new Set(users.filter(u => u.bankId).map(u => u.bankId)).size : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collaborateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Banque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    {user.phone && (
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'BANK_ADMIN' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                       user.role === 'BANK_ADMIN' ? 'Admin Banque' :
                       'Collaborateur'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.bank ? (
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{user.bank.name}</span>
                        <span className="text-xs text-gray-400 ml-2">({user.bank.code})</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Aucune banque</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-700"
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'Aucun collaborateur trouvé' : 'Aucun collaborateur'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par créer votre premier collaborateur.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Button
                  onClick={handleCreateUser}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un collaborateur
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
          isLoading={isSaving}
        />
      )}
    </div>
  );
} 