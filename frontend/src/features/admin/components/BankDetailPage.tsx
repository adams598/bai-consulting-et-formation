import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Bank, User, Formation, BankFormation, UserFormationAssignment } from '../types';
import { banksApi, usersApi, formationsApi, bankFormationApi, userFormationAssignmentApi } from '../../../api/adminApi';
import { useToast } from '../../../components/ui/use-toast';
import ConfirmModal from './ConfirmModal';
import AssignFormationModal from './AssignFormationModal';
import AssignUsersModal from './AssignUsersModal';
import UserAssignmentsList from './UserAssignmentsList';
import CreateUserModal from './CreateUserModal';
import { Plus, Users, BookOpen, BarChart3 } from 'lucide-react';

const BankDetailPage: React.FC = () => {
  const { bankId } = useParams<{ bankId: string }>();
  const [bank, setBank] = useState<Bank | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [bankFormations, setBankFormations] = useState<BankFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'formations'>('overview');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showUserAssignmentModal, setShowUserAssignmentModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<BankFormation | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    console.log('🔍 useEffect déclenché avec bankId:', bankId);
    if (bankId) {
      loadBankDetails();
    } else {
      console.log('❌ Aucun bankId fourni dans les paramètres');
    }
  }, [bankId]);

  const loadBankDetails = async () => {
    try {
      console.log('🔍 loadBankDetails appelé avec bankId:', bankId);
      setLoading(true);
      
      console.log('📡 Appel des APIs...');
      const [bankResponse, usersResponse, formationsResponse, bankFormationsResponse] = await Promise.all([
        banksApi.getById(bankId!),
        usersApi.getAll(bankId!),
        formationsApi.getAllFormations(),
        bankFormationApi.getBankFormations(bankId!)
      ]);

      console.log('📊 Réponse banque complète:', bankResponse);
      console.log('👥 Réponse utilisateurs complète:', usersResponse);
      console.log('📚 Réponse formations complète:', formationsResponse);
      console.log('🔗 Réponse banque-formations complète:', bankFormationsResponse);

      // Extraire les données des réponses Axios
      const bankData = bankResponse.data;
      const usersData = usersResponse.data;
      const formationsData = formationsResponse.data;
      // Les APIs bankFormation et userFormationAssignment retournent directement ApiResponse<T>
      const bankFormationsData = bankFormationsResponse;

      console.log('📊 Données banque extraites:', bankData);
      console.log('👥 Données utilisateurs extraites:', usersData);
      console.log('📚 Données formations extraites:', formationsData);
      console.log('🔗 Données banque-formations extraites:', bankFormationsData);

      if (bankData.success) {
        console.log('✅ Banque récupérée avec succès:', bankData.data);
        setBank(bankData.data);
      } else {
        console.log('❌ Échec récupération banque:', bankData);
      }

      if (usersData.success) {
        console.log('✅ Utilisateurs récupérés avec succès:', usersData.data);
        setUsers(usersData.data || []);
      } else {
        console.log('❌ Échec récupération utilisateurs:', usersData);
      }

      if (formationsData.success) {
        console.log('✅ Formations récupérées avec succès:', formationsData.data);
        setFormations(formationsData.data || []);
      } else {
        console.log('❌ Échec récupération formations:', formationsData);
      }

      if (bankFormationsData.success) {
        console.log('✅ Banque-formations récupérées avec succès:', bankFormationsData.data);
        setBankFormations(bankFormationsData.data || []);
      } else {
        console.log('❌ Échec récupération banque-formations:', bankFormationsData);
      }
    } catch (error) {
      console.error('💥 Erreur lors du chargement des détails de la banque:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la banque",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
    password: string;
  }) => {
    try {
      console.log('📤 Données utilisateur envoyées:', userData);
      
      const response = await usersApi.create({
        ...userData,
        bankId: bankId!
      } as any);

      console.log('📥 Réponse de création utilisateur:', response);

      if (response.data.success) {
        toast({
          title: "Succès",
          description: "Collaborateur créé avec succès",
        });

        // Afficher les identifiants
        setConfirmModalData({
          title: "Compte créé avec succès",
          message: `Identifiants du collaborateur :\n\nEmail: ${userData.email}\nMot de passe: ${userData.password}\n\n⚠️ IMPORTANT : Ce mot de passe est temporaire et expire dans 5 jours.\nL'utilisateur devra le changer lors de sa première connexion.`,
          onConfirm: () => {
            setShowConfirmModal(false);
            loadBankDetails();
          }
        });
        setShowConfirmModal(true);
      } else {
        toast({
          title: "Erreur",
          description: response.data.message || "Impossible de créer le collaborateur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création du collaborateur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le collaborateur",
        variant: "destructive",
      });
    }
  };

  const handleAssignFormations = async (formationIds: string[]) => {
    try {
      for (const formationId of formationIds) {
        await bankFormationApi.assignFormationToBank({
          bankId: bankId!,
          formationId
        });
      }

      toast({
        title: "Succès",
        description: `${formationIds.length} formation(s) assignée(s) avec succès`,
      });

      setShowFormationModal(false);
      loadBankDetails();
    } catch (error) {
      console.error('Erreur lors de l\'assignation des formations:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner les formations",
        variant: "destructive",
      });
    }
  };

  const handleAssignUsersByGroup = async (data: { groupType: string; groupValue: string; isMandatory: boolean; dueDate?: string }) => {
    if (!selectedFormation) return;

    try {
      const response = await userFormationAssignmentApi.assignUsersByGroup(
        selectedFormation.id,
        data
      );

      if (response.success) {
        toast({
          title: "Succès",
          description: `${response.data.length} utilisateur(s) assigné(s) avec succès`,
        });

        setShowUserAssignmentModal(false);
        setSelectedFormation(null);
        loadBankDetails();
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner les utilisateurs",
        variant: "destructive",
      });
    }
  };

  const handleToggleFormationMandatory = async (bankFormationId: string, isMandatory: boolean) => {
    try {
      await bankFormationApi.updateFormationMandatory(bankFormationId, { isMandatory });
      toast({
        title: "Succès",
        description: `Formation ${isMandatory ? 'marquée comme obligatoire' : 'marquée comme optionnelle'}`,
      });
      loadBankDetails();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFormation = async (bankFormationId: string) => {
    setConfirmModalData({
      title: "Retirer la formation",
      message: "Êtes-vous sûr de vouloir retirer cette formation de la banque ?",
      onConfirm: async () => {
        try {
          await bankFormationApi.removeFormationFromBank(bankFormationId);
          toast({
            title: "Succès",
            description: "Formation retirée avec succès",
          });
          loadBankDetails();
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          toast({
            title: "Erreur",
            description: "Impossible de retirer la formation",
            variant: "destructive",
          });
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  console.log('🔄 État du composant - loading:', loading, 'bank:', bank, 'bankId:', bankId);
  
  if (loading) {
    console.log('⏳ Affichage du loader...');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bank) {
    console.log('❌ Aucune banque trouvée, affichage du message d\'erreur');
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Banque non trouvée</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          ID de la banque demandée : {bankId}
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Vérifiez que l'URL est correcte et que vous avez les permissions nécessaires.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {bank.name} ({bank.code})
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Statut: {bank.isActive ? 'Active' : 'Inactive'} | 
          {bank.isArchived ? ' Archivée' : ' Non archivée'}
        </p>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Vue d\'ensemble' },
            { id: 'users', label: 'Collaborateurs' },
            { id: 'formations', label: 'Formations' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Informations de la banque */}
          <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Informations de la banque</h2>
              <button
                onClick={() => setShowFormationModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assigner une formation
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{bank?.name}</h3>
                <p className="text-gray-600">Code: {bank?.code}</p>
                <p className="text-gray-600">Statut: {bank?.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p className="text-gray-600">Utilisateurs: {users.length}</p>
                <p className="text-gray-600">Formations: {bankFormations.length}</p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total utilisateurs</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Formations assignées</p>
                  <p className="text-2xl font-bold text-gray-900">{bankFormations.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Taux d'activité</p>
                  <p className="text-2xl font-bold text-gray-900">85%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gestion des utilisateurs */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Utilisateurs de la banque</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un utilisateur
              </button>
            </div>
            
            <UserAssignmentsList 
              users={users}
              onAssignFormation={() => setShowUserAssignmentModal(true)}
            />
          </div>
        </div>
      )}

      {/* Gestion des formations */}
      {activeTab === 'formations' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Formations assignées</h2>
              <button
                onClick={() => setShowFormationModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assigner une formation
              </button>
            </div>
            
            <div className="space-y-4">
              {bankFormations.map((bankFormation) => (
                <div key={bankFormation.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{bankFormation.formation?.title}</h3>
                      <p className="text-sm text-gray-600">{bankFormation.formation?.description}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveFormation(bankFormation.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal d'assignation de formations */}
      {showFormationModal && (
        <AssignFormationModal
          isOpen={showFormationModal}
          onClose={() => setShowFormationModal(false)}
          onAssign={handleAssignFormations}
          bankId={bankId!}
        />
      )}

      {/* Modal d'assignation d'utilisateurs */}
      {showUserAssignmentModal && selectedFormation && (
        <AssignUsersModal
          isOpen={showUserAssignmentModal}
          onClose={() => setShowUserAssignmentModal(false)}
          onAssign={handleAssignUsersByGroup}
          bankFormation={selectedFormation}
          bankId={bankId!}
        />
      )}

      {/* Modal de création d'utilisateur */}
      {showCreateUserModal && (
        <CreateUserModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          onSubmit={handleCreateUser}
          bankId={bankId!}
        />
      )}

      {/* Modal de confirmation */}
      {showConfirmModal && confirmModalData && (
        <ConfirmModal
          title={confirmModalData.title}
          message={confirmModalData.message}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default BankDetailPage;

