import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          icon: 'text-orange-600',
          confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white',
          border: 'border-orange-200'
        };
      case 'info':
        return {
          icon: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          border: 'border-blue-200'
        };
      default:
        return {
          icon: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-200'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
