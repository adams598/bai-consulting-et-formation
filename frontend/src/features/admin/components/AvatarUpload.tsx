import React, { useState, useRef } from 'react';
import { Camera, X, Upload, User } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/use-toast';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange: (avatarUrl: string) => void;
  onRemoveAvatar: () => void;
  disabled?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onAvatarChange,
  onRemoveAvatar,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image (JPEG, PNG ou GIF)",
        variant: "destructive",
      });
      return;
    }

    // Validation de la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5MB",
        variant: "destructive",
      });
      return;
    }

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreviewUrl(url);
      
      // Simuler l'upload (dans un vrai projet, tu uploaderais vers un serveur)
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        onAvatarChange(url);
        toast({
          title: "Succès",
          description: "Photo de profil mise à jour",
        });
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    onRemoveAvatar();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Succès",
      description: "Photo de profil supprimée",
    });
  };

  const handleClickUpload = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>
        
        {/* Overlay pour l'upload */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClickUpload}
          disabled={disabled || isUploading}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Upload...' : 'Changer'}</span>
        </Button>
        
        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={disabled || isUploading}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            <span>Supprimer</span>
          </Button>
        )}
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Instructions */}
      <div className="text-xs text-gray-500 text-center max-w-xs">
        <p>Formats acceptés : JPEG, PNG, GIF</p>
        <p>Taille maximale : 5MB</p>
      </div>
    </div>
  );
}; 