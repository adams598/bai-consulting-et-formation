import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (users: Array<{ email: string; firstName: string; lastName: string; department: string }>) => void;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave }) => {
  const [users, setUsers] = useState<Array<{ email: string; firstName: string; lastName: string; department: string }>>([
    { email: '', firstName: '', lastName: '', department: '' }
  ]);

  const addUser = () => {
    setUsers([...users, { email: '', firstName: '', lastName: '', department: '' }]);
  };

  const removeUser = (index: number) => {
    if (users.length > 1) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  const updateUser = (index: number, field: string, value: string) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setUsers(newUsers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const validUsers = users.filter(user => 
      user.email.trim() && user.firstName.trim() && user.lastName.trim()
    );
    
    if (validUsers.length === 0) {
      alert('Au moins un utilisateur valide est requis');
      return;
    }

    onSave(validUsers);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Ajouter des Collaborateurs
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {users.map((user, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium text-gray-900">
                  Collaborateur {index + 1}
                </h3>
                {users.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUser(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={user.firstName}
                    onChange={(e) => updateUser(index, 'firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prénom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={user.lastName}
                    onChange={(e) => updateUser(index, 'lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email professionnel *
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) => updateUser(index, 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@banque.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Département
                  </label>
                  <input
                    type="text"
                    value={user.department}
                    onChange={(e) => updateUser(index, 'department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Département (optionnel)"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={addUser}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un autre collaborateur
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Créer les comptes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal; 