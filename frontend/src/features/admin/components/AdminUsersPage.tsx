import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, User, Mail, Building, Shield, Clock, Grid, List, Phone } from 'lucide-react';
import { User as UserType } from '../types';
import { usersApi } from '../../../api/adminApi';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import ConfirmationModal from './ConfirmationModal';
import { useConfirmation } from '../../../hooks/useConfirmation';

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
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  const { toast } = useToast();
  
  // Hook de confirmation
  const confirmation = useConfirmation();

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getAll(''); // Pas de bankId pour l'instant
      const usersData = Array.isArray(response.data?.data) ? response.data.data : 
                       Array.isArray(response.data) ? response.data : [];
      
      // Normaliser les données - s'assurer que isActive est défini
      const normalizedUsers = usersData.map(user => ({
        ...user,
        // S'assurer que isActive est un boolean
        isActive: user.isActive !== undefined ? Boolean(user.isActive) : true
      }));
      
      setUsers(normalizedUsers);
      setFilteredUsers(normalizedUsers);
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
      const matchesSearch = !searchTerm || 
        (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.bank?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      // Filtre par rôle
      const matchesRole = !roleFilter || roleFilter === '' || user.role === roleFilter;

      // Filtre par banque
      const matchesBank = !bankFilter || bankFilter === '' || user.bankId === bankFilter;

      // Filtre par statut - logique claire et simple
      let matchesStatus = true;
      if (statusFilter && statusFilter !== '') {
        switch (statusFilter) {
          case 'active':
            matchesStatus = user.isActive === true;
            break;
          case 'inactive':
            matchesStatus = user.isActive === false;
            break;
          default:
            matchesStatus = true; // "Tous les statuts" ou valeur inconnue
        }
      }

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
        // Mise à jour optimiste : modifier immédiatement l'utilisateur dans l'interface
        const updatedUser = { ...editingUser, ...data };
        setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
        
        setShowModal(false);
        setEditingUser(null);
        
        // Appel API en arrière-plan
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
        
        // Mise à jour optimiste : créer immédiatement l'utilisateur dans l'interface
        const tempId = `temp-${Date.now()}`;
        const newUser: UserType = {
          id: tempId,
          firstName: createData.firstName,
          lastName: createData.lastName,
          email: createData.email,
          role: createData.role,
          department: createData.department,
          phone: createData.phone,
          isActive: createData.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
          bankId: undefined,
          bank: undefined
        };
        setUsers(prev => [newUser, ...prev]);
        
        setShowModal(false);
        setEditingUser(null);
        
        // Appel API en arrière-plan
        const response = await usersApi.create(createData);
        
        // Remplacer l'utilisateur temporaire par la vraie réponse de l'API
        if (response.data?.data) {
          setUsers(prev => 
            prev.map(u => u.id === tempId ? response.data.data : u)
          );
        }
        
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès",
        });
      }
    } catch (error: any) {
      // En cas d'erreur, recharger les données pour restaurer l'état correct
      await loadUsers();
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
    confirmation.showConfirmation({
      title: 'Supprimer l\'utilisateur',
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.firstName} ${user.lastName}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Mise à jour optimiste : supprimer immédiatement l'utilisateur de l'interface
          setUsers(prev => prev.filter(u => u.id !== user.id));
          
          // Appel API en arrière-plan
      await usersApi.delete(user.id);
          
      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });
    } catch (error: any) {
          // En cas d'erreur, recharger les données pour restaurer l'état correct
          await loadUsers();
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
      }
    });
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
      {/* <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Collaborateurs</h2>
          <p className="text-gray-600">Gérez les collaborateurs de votre plateforme</p>
        </div>
      </div> */}

      {/* Header avec toggle de vue et filtres */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-5">
          <h3 className="text-lg font-medium text-gray-800 mb-4 lg:mb-0">Filtres et recherche</h3>
          
          {/* Toggle de vue */}
          <div className="flex items-center bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'cards' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4 mr-2" />
              Cartes
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche textuelle */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>

          {/* Filtre par rôle */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
            className="text-sm text-gray-600 hover:text-gray-800 border-gray-200 hover:border-gray-300"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <User className="w-7 h-7 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Collaborateurs</p>
              <p className="text-xl font-semibold text-gray-800">{Array.isArray(users) ? users.length : 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <Shield className="w-7 h-7 text-emerald-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administrateurs</p>
              <p className="text-xl font-semibold text-gray-800">
                {Array.isArray(users) ? users.filter(u => u.role === 'BANK_ADMIN' || u.role === 'SUPER_ADMIN').length : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <Clock className="w-7 h-7 text-amber-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-xl font-semibold text-gray-800">
                {Array.isArray(users) ? users.filter(u => u.isActive === true).length : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <Building className="w-7 h-7 text-violet-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Banques</p>
              <p className="text-xl font-semibold text-gray-800">
                {Array.isArray(users) ? new Set(users.filter(u => u.bankId).map(u => u.bankId)).size : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vue Liste */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
              <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Collaborateur
                </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Rôle
                </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Banque
                </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-700">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </span>
                        </div>
                      <div>
                          <div className="text-sm font-medium text-gray-800">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{user.email}</div>
                    {user.phone && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {user.phone}
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        user.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-700 border border-red-200' :
                        user.role === 'BANK_ADMIN' ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                       user.role === 'BANK_ADMIN' ? 'Admin Banque' :
                       'Collaborateur'}
                    </span>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
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
                          className="border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                          className="border-red-200 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            <div className="px-6 py-4 border-t border-gray-100">
          <Button
          onClick={handleCreateUser}
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
                Ajouter un collaborateur
        </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vue Cartes */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mr-4">
                    <span className="text-lg font-medium text-blue-700">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-800">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  user.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                    user.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-700 border border-red-200' :
                    user.role === 'BANK_ADMIN' ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                     user.role === 'BANK_ADMIN' ? 'Admin Banque' :
                     'Collaborateur'}
                  </span>
                </div>
                
                {user.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {user.phone}
                  </div>
                )}
                
                {user.bank && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{user.bank.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({user.bank.code})</span>
                  </div>
                )}
                
                {user.department && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Département:</span> {user.department}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                  className="border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(user)}
                  className="border-red-200 text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Carte pour ajouter un nouveau collaborateur */}
          <div 
            onClick={handleCreateUser}
            className="bg-white rounded-xl shadow-sm border border-gray-200 border-dashed p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center min-h-[280px] text-center group hover:border-blue-300"
          >
            <Plus className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mb-3 transition-colors" />
            <h3 className="text-base font-medium text-gray-600 group-hover:text-gray-800 mb-2">
              Ajouter un collaborateur
            </h3>
            <p className="text-sm text-gray-500">
              Cliquez pour créer un nouveau collaborateur
            </p>
          </div>
        </div>
      )}

      {/* État vide */}
        {filteredUsers.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16">
          <User className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
              {searchTerm ? 'Aucun collaborateur trouvé' : 'Aucun collaborateur'}
            </h3>
          <p className="text-sm text-gray-600 mb-6">
              {searchTerm 
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par créer votre premier collaborateur.'
              }
            </p>
            {!searchTerm && (
                <Button
                  onClick={handleCreateUser}
              className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un collaborateur
                </Button>
            )}
          </div>
        )}

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
} 