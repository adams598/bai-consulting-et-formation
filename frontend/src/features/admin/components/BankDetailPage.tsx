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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Collaborateurs</span>
                <span className="font-semibold text-gray-900 dark:text-white">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Formations assignées</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bankFormations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Formations obligatoires</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {bankFormations.filter(bf => bf.isMandatory).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Code</span>
                <span className="font-mono text-gray-900 dark:text-white">{bank.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Créée le</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(bank.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Dernière mise à jour</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(bank.updatedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('users')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Gérer les collaborateurs
              </button>
              <button
                onClick={() => setActiveTab('formations')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Gérer les formations
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Collaborateurs</h2>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Nouveau collaborateur
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Département
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.department || 'Non défini'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'formations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Formations assignées</h2>
            <button
              onClick={() => setShowFormationModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Assigner des formations
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Formation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Obligatoire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Utilisateurs assignés
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {bankFormations.map((bankFormation) => (
                  <React.Fragment key={bankFormation.id}>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {bankFormation.formation?.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {bankFormation.formation?.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {bankFormation.formation?.duration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleFormationMandatory(bankFormation.id, !bankFormation.isMandatory)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                            bankFormation.isMandatory
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                          {bankFormation.isMandatory ? 'Obligatoire' : 'Optionnelle'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {bankFormation.userAssignments?.length || 0} utilisateur(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedFormation(bankFormation);
                            setShowUserAssignmentModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Assigner des utilisateurs
                        </button>
                        <button
                          onClick={() => handleRemoveFormation(bankFormation.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Retirer
                        </button>
                      </td>
                    </tr>
                    {/* Ligne d'assignations utilisateurs */}
                    {bankFormation.userAssignments && bankFormation.userAssignments.length > 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-2 bg-gray-50 dark:bg-gray-700">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>Utilisateurs assignés ({bankFormation.userAssignments.length})</strong>
                          </div>
                          <UserAssignmentsList
                            bankFormationId={bankFormation.id}
                            onUpdate={loadBankDetails}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
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

