import React from 'react';
import Switch from './Switch';

interface SwitchCardProps {
  icon: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SwitchCard: React.FC<SwitchCardProps> = ({ icon, label, checked, onChange, disabled }) => {
  return (
    <div className="bg-neutral-800 rounded-lg p-3 flex items-center w-full text-left space-x-4">
      <div className="flex items-center gap-3 flex-grow">
        <span className="material-symbols-outlined text-2xl text-neutral-400 p-1">
          {icon}
        </span>
        <p className="font-semibold text-gray-200 text-lg">{label}</p>
      </div>
      <div className="flex-shrink-0">
        <Switch checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
};

export default SwitchCard;