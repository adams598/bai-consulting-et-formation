import React, { useState, useEffect } from 'react';
import { UserFormationAssignment } from '../types';
import { userFormationAssignmentApi } from '../../../api/adminApi';
import { useToast } from '../../../components/ui/use-toast';

interface UserAssignmentsListProps {
  bankFormationId: string;
  onUpdate: () => void;
}

const UserAssignmentsList: React.FC<UserAssignmentsListProps> = ({
  bankFormationId,
  onUpdate
}) => {
  const [assignments, setAssignments] = useState<UserFormationAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    isMandatory: false,
    dueDate: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    loadAssignments();
  }, [bankFormationId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await userFormationAssignmentApi.getFormationUserAssignments(bankFormationId);
      if (response.success) {
        setAssignments(response.data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des assignations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les assignations utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAssignment = (assignment: UserFormationAssignment) => {
    setEditingAssignment(assignment.id);
    setEditData({
      isMandatory: assignment.isMandatory,
      dueDate: assignment.dueDate || '',
    });
  };

  const handleSaveAssignment = async (assignmentId: string) => {
    try {
      const response = await userFormationAssignmentApi.updateUserFormationMandatory(
        assignmentId,
        {
          isMandatory: editData.isMandatory,
          dueDate: editData.dueDate || undefined,
        }
      );

      if (response.success) {
        toast({
          title: "Succès",
          description: "Assignation mise à jour avec succès",
        });
        setEditingAssignment(null);
        loadAssignments();
        onUpdate();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'assignation",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir retirer cet utilisateur de la formation ?')) {
      try {
        await userFormationAssignmentApi.removeUserFromFormation(assignmentId);
        toast({
          title: "Succès",
          description: "Utilisateur retiré avec succès",
        });
        loadAssignments();
        onUpdate();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: "Erreur",
          description: "Impossible de retirer l'utilisateur",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        Aucun utilisateur assigné à cette formation
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-8 w-8">
              {assignment.user?.avatar ? (
                <img className="h-8 w-8 rounded-full" src={assignment.user.avatar} alt="" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {assignment.user?.firstName?.charAt(0)}{assignment.user?.lastName?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {assignment.user?.firstName} {assignment.user?.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {assignment.user?.email} • {assignment.user?.department || 'Département non défini'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {editingAssignment === assignment.id ? (
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={editData.isMandatory}
                    onChange={(e) => setEditData({...editData, isMandatory: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Obligatoire</span>
                </label>
                <input
                  type="date"
                  value={editData.dueDate}
                  onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => handleSaveAssignment(assignment.id)}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => setEditingAssignment(null)}
                  className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  assignment.isMandatory
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {assignment.isMandatory ? 'Obligatoire' : 'Optionnelle'}
                </span>
                {assignment.dueDate && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Limite: {new Date(assignment.dueDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
                <button
                  onClick={() => handleEditAssignment(assignment)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleRemoveAssignment(assignment.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-xs"
                >
                  Retirer
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserAssignmentsList;
