import React from 'react';
import ButtonBasic from './ui/ButtonBasic';

interface SurrenderConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  isClosing: boolean;
  planetName: string;
}

const SurrenderConfirmDialog: React.FC<SurrenderConfirmDialogProps> = ({ onConfirm, onCancel, isClosing, planetName }) => {
  const animationClass = isClosing ? 'animate-close-dialog' : 'animate-open-dialog';

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${animationClass}`}>
      <div className="bg-neutral-900 text-center flex flex-col w-full max-w-md rounded-lg border border-neutral-700 p-8">
        <h1 className={`text-3xl font-bold text-red-400`}>Surrender</h1>
        <p className="text-neutral-300 mt-4 text-lg">Abandon your attempted conquest of {planetName}?</p>
        <div className="flex justify-center gap-4 mt-8">
            <button
                onClick={onCancel}
                className="font-bold transition-all duration-300 rounded-full text-lg px-8 py-3 text-neutral-300 hover:bg-neutral-700"
            >
                Cancel
            </button>
            <ButtonBasic
                onClick={onConfirm}
                className={`bg-red-600 hover:bg-red-500`}
            >
                Surrender
            </ButtonBasic>
        </div>
      </div>
    </div>
  );
};

export default SurrenderConfirmDialog;