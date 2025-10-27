import React, { useState, useEffect } from 'react';
import { X, Users, Building2, Filter, Send, BarChart3 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/use-toast';

interface Bank {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
}

interface Formation {
  id: string;
  title: string;
  description: string;
}

interface AdvancedAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formation: Formation;
  banks: Bank[];
  users: User[];
}

const AdvancedAssignmentsModal: React.FC<AdvancedAssignmentsModalProps> = ({
  isOpen,
  onClose,
  formation,
  banks,
  users,
}) => {
  const [activeTab, setActiveTab] = useState<'bulk-banks' | 'bulk-users' | 'criteria'>('bulk-banks');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [criteria, setCriteria] = useState({
    role: '',
    department: '',
    position: '',
  });
  const [assignmentData, setAssignmentData] = useState({
    mandatory: false,
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setSelectedBanks([]);
      setSelectedUsers([]);
      setCriteria({ role: '', department: '', position: '' });
      setAssignmentData({ mandatory: false, dueDate: '' });
    }
  }, [isOpen]);

  const handleBulkAssignToBanks = async () => {
    if (selectedBanks.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une banque",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/assignments/bulk-banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          formationId: formation.id,
          bankIds: selectedBanks,
          mandatory: assignmentData.mandatory,
          dueDate: assignmentData.dueDate || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: data.message,
        });
        onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'assignation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssignUsers = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un utilisateur",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/assignments/bulk-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          bankFormationId: '', // This would need to be passed as prop
          userIds: selectedUsers,
          mandatory: assignmentData.mandatory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: data.message,
        });
        onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'assignation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignByCriteria = async () => {
    if (!criteria.role && !criteria.department && !criteria.position) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un critère",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/assignments/by-criteria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          bankFormationId: '', // This would need to be passed as prop
          criteria: {
            role: criteria.role || undefined,
            department: criteria.department || undefined,
            position: criteria.position || undefined,
          },
          mandatory: assignmentData.mandatory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: data.message,
        });
        onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'assignation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Assignations Avancées - {formation.title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bulk-banks'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('bulk-banks')}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Assignation par Banques
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bulk-users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('bulk-users')}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Assignation par Utilisateurs
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'criteria'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('criteria')}
          >
            <Filter className="h-4 w-4 inline mr-2" />
            Assignation par Critères
          </button>
        </div>

        {/* Assignment Options */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Options d'assignation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mandatory"
                checked={assignmentData.mandatory}
                onChange={(e) => setAssignmentData({ ...assignmentData, mandatory: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="mandatory" className="text-sm font-medium text-gray-700">
                Formation obligatoire
              </label>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date limite (optionnel)
              </label>
              <input
                type="date"
                id="dueDate"
                value={assignmentData.dueDate}
                onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'bulk-banks' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Sélectionner les banques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
              {banks.map((bank) => (
                <div key={bank.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`bank-${bank.id}`}
                    checked={selectedBanks.includes(bank.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBanks([...selectedBanks, bank.id]);
                      } else {
                        setSelectedBanks(selectedBanks.filter(id => id !== bank.id));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`bank-${bank.id}`} className="text-sm text-gray-700">
                    {bank.name} ({bank.code})
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleBulkAssignToBanks}
                disabled={loading || selectedBanks.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Assignation...' : `Assigner à ${selectedBanks.length} banque(s)`}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'bulk-users' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Sélectionner les utilisateurs</h3>
            <div className="max-h-60 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 py-2 border-b border-gray-100">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`user-${user.id}`} className="text-sm text-gray-700 flex-1">
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-gray-500">{user.email} • {user.role}</div>
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleBulkAssignUsers}
                disabled={loading || selectedUsers.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Assignation...' : `Assigner à ${selectedUsers.length} utilisateur(s)`}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'criteria' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Critères d'assignation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <select
                  id="role"
                  value={criteria.role}
                  onChange={(e) => setCriteria({ ...criteria, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les rôles</option>
                  <option value="ADMIN">Administrateur</option>
                  <option value="MANAGER">Manager</option>
                  <option value="COLLABORATOR">Collaborateur</option>
                </select>
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Département
                </label>
                <input
                  type="text"
                  id="department"
                  value={criteria.department}
                  onChange={(e) => setCriteria({ ...criteria, department: e.target.value })}
                  placeholder="Ex: RH, IT, Finance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Poste
                </label>
                <input
                  type="text"
                  id="position"
                  value={criteria.position}
                  onChange={(e) => setCriteria({ ...criteria, position: e.target.value })}
                  placeholder="Ex: Développeur, Analyste"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleAssignByCriteria}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Assignation...' : 'Assigner selon les critères'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAssignmentsModal;






















