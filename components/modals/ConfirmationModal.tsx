import React, { useState, useEffect } from 'react';
import Input from '../forms/Input';
import Button from '../forms/Button';
import { TimesIcon } from '../icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmationText: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmationText,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonVariant = "danger",
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(''); // Reset input when modal opens
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const canConfirm = inputValue === confirmationText;

  return (
    <div
      className="fixed inset-0 bg-brand-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 modal-overlay-animate"
      aria-labelledby="confirmation-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md modal-content-animate">
        <div className="flex items-center justify-between p-4 border-b border-brand-neutral-200">
          <h2 id="confirmation-modal-title" className="text-lg font-semibold text-brand-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-brand-text-muted hover:text-brand-primary p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary-light"
            aria-label="Close modal"
          >
            <TimesIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="text-sm text-brand-text-secondary mb-4">{message}</div>
          <Input
            id="confirmationInput"
            label={`To confirm, type "${confirmationText}" below:`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Type ${confirmationText}`}
            autoFocus
            containerClassName="mb-0" // Remove default bottom margin
          />
        </div>
        <div className="flex justify-end space-x-3 p-4 bg-brand-neutral-50/50 rounded-b-lg">
          <Button variant="outline" onClick={onClose}>
            {cancelButtonText}
          </Button>
          <Button variant={confirmButtonVariant} onClick={onConfirm} disabled={!canConfirm}>
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
