import { useState } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void | Promise<void>;
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showConfirmation = (confirmationOptions: ConfirmationOptions) => {
    setOptions(confirmationOptions);
    setIsOpen(true);
  };

  const hideConfirmation = () => {
    setIsOpen(false);
    setOptions(null);
    setIsLoading(false);
  };

  const handleConfirm = async () => {
    if (!options) return;
    
    setIsLoading(true);
    try {
      await options.onConfirm();
      hideConfirmation();
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      setIsLoading(false);
    }
  };

  return {
    isOpen,
    options,
    isLoading,
    showConfirmation,
    hideConfirmation,
    handleConfirm
  };
};









