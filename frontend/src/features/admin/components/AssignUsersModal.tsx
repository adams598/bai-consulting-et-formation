import React, { useState, useEffect } from 'react';
import { User, BankFormation } from '../types';
import { usersApi } from '../../../api/adminApi';

interface AssignUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: { groupType: string; groupValue: string; isMandatory: boolean; dueDate?: string }) => void;
  bankFormation: BankFormation;
  bankId: string;
}

const AssignUsersModal: React.FC<AssignUsersModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  bankFormation,
  bankId
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupAssignment, setGroupAssignment] = useState({
    groupType: 'department',
    groupValue: '',
    isMandatory: false,
    dueDate: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, bankId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll(bankId);
      if (response.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = () => {
    if (groupAssignment.groupType === 'all' || groupAssignment.groupValue) {
      onAssign(groupAssignment);
      setGroupAssignment({
        groupType: 'department',
        groupValue: '',
        isMandatory: false,
        dueDate: '',
      });
    }
  };

  const getAvailableGroups = () => {
    if (groupAssignment.groupType === 'department') {
      return Array.from(new Set(users.map(u => u.department).filter(Boolean)));
    } else if (groupAssignment.groupType === 'role') {
      return ['COLLABORATOR', 'BANK_ADMIN', 'SUPER_ADMIN'];
    }
    return [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Assigner des utilisateurs à {bankFormation.formation?.title}
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de groupe
                </label>
                <select
                  value={groupAssignment.groupType}
                  onChange={(e) => setGroupAssignment({...groupAssignment, groupType: e.target.value, groupValue: ''})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="department">Par département</option>
                  <option value="role">Par rôle</option>
                  <option value="all">Tous les utilisateurs</option>
                </select>
              </div>

              {groupAssignment.groupType !== 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valeur du groupe
                  </label>
                  <select
                    value={groupAssignment.groupValue}
                    onChange={(e) => setGroupAssignment({...groupAssignment, groupValue: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sélectionner {groupAssignment.groupType === 'department' ? 'un département' : 'un rôle'}</option>
                    {getAvailableGroups().map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={groupAssignment.isMandatory}
                    onChange={(e) => setGroupAssignment({...groupAssignment, isMandatory: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Formation obligatoire</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date limite (optionnel)
                </label>
                <input
                  type="date"
                  value={groupAssignment.dueDate}
                  onChange={(e) => setGroupAssignment({...groupAssignment, dueDate: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Résumé de l'assignation</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Formation: <span className="font-medium">{bankFormation.formation?.title}</span></p>
                  <p>Groupe: <span className="font-medium">
                    {groupAssignment.groupType === 'all' ? 'Tous les utilisateurs' : 
                     groupAssignment.groupType === 'department' ? `Département: ${groupAssignment.groupValue || 'Non sélectionné'}` :
                     `Rôle: ${groupAssignment.groupValue || 'Non sélectionné'}`}
                  </span></p>
                  <p>Obligatoire: <span className="font-medium">{groupAssignment.isMandatory ? 'Oui' : 'Non'}</span></p>
                  {groupAssignment.dueDate && (
                    <p>Date limite: <span className="font-medium">{new Date(groupAssignment.dueDate).toLocaleDateString('fr-FR')}</span></p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAssign}
                  disabled={groupAssignment.groupType !== 'all' && !groupAssignment.groupValue}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assigner
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignUsersModal;
