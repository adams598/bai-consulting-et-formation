import React, { useState } from 'react';
import { X, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../components/ui/use-toast';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
    password: string;
  }) => void;
  bankId: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bankId
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'COLLABORATOR',
    department: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Générer un mot de passe sécurisé
  const generateSecurePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Assurer au moins un caractère de chaque type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Majuscule
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minuscule
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Chiffre
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Caractère spécial
    
    // Remplir le reste
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mélanger les caractères
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData(prev => ({ ...prev, password }));
  };

  // Copier le mot de passe dans le presse-papiers
  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.password);
      toast({
        title: "Mot de passe copié",
        description: "Le mot de passe a été copié dans le presse-papiers",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le mot de passe",
        variant: "destructive",
      });
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast({
        title: "Erreur",
        description: "Le prénom est obligatoire",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.lastName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est obligatoire",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.email.trim()) {
      toast({
        title: "Erreur",
        description: "L'email est obligatoire",
        variant: "destructive",
      });
      return false;
    }
    
    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erreur",
        description: "L'email n'est pas valide",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.password.trim()) {
      toast({
        title: "Erreur",
        description: "Le mot de passe est obligatoire",
        variant: "destructive",
      });
      return false;
    }
    
    if (formData.password.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await onSubmit(formData);
      onClose();
      // Réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'COLLABORATOR',
        department: '',
        password: ''
      });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Générer automatiquement un mot de passe à l'ouverture
  React.useEffect(() => {
    if (isOpen && !formData.password) {
      generateSecurePassword();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Nouveau collaborateur
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Prénom */}
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              Prénom *
            </Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Prénom du collaborateur"
              className="mt-1"
              required
            />
          </div>

          {/* Nom */}
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
              Nom *
            </Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Nom du collaborateur"
              className="mt-1"
              required
            />
          </div>

          {/* Email professionnel */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email professionnel *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="collaborateur@banque.com"
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              L'utilisateur se connectera avec cet email
            </p>
          </div>

          {/* Rôle */}
          <div>
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              Rôle *
            </Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="COLLABORATOR">Collaborateur</option>
              <option value="BANK_ADMIN">Administrateur de banque</option>
              <option value="SUPER_ADMIN">Super administrateur</option>
            </select>
          </div>

          {/* Département */}
          <div>
            <Label htmlFor="department" className="text-sm font-medium text-gray-700">
              Département
            </Label>
            <Input
              id="department"
              type="text"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              placeholder="Ex: Commercial, RH, IT..."
              className="mt-1"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Mot de passe temporaire *
            </Label>
            <div className="mt-1 relative">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mot de passe sécurisé"
                    className="pr-20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  onClick={generateSecurePassword}
                  variant="outline"
                  size="sm"
                  className="px-3"
                  title="Générer un nouveau mot de passe"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={copyPassword}
                  variant="outline"
                  size="sm"
                  className="px-3"
                  title="Copier le mot de passe"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ Mot de passe temporaire valide 5 jours. L'utilisateur devra le changer lors de sa première connexion.
              </p>
            </div>
          </div>

          {/* Informations importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              ⚠️ Informations importantes
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Le mot de passe est temporaire et expire dans 5 jours</li>
              <li>• L'utilisateur recevra ses identifiants par email</li>
              <li>• Il devra changer son mot de passe lors de sa première connexion</li>
              <li>• En cas d'oubli, vous pourrez générer un nouveau mot de passe temporaire</li>
            </ul>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Création...</span>
                </div>
              ) : (
                'Créer le compte'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
