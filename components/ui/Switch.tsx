import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, className, disabled = false }) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const trackBgClass = checked ? 'bg-[var(--color-accent-600)]' : 'bg-neutral-700';
  const thumbPositionClass = checked ? 'translate-x-full' : 'translate-x-0';
  const thumbBgClass = checked ? 'bg-[var(--color-accent-50)]' : 'bg-neutral-300';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
      disabled={disabled}
      className={`relative inline-flex items-center h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:ring-[var(--color-accent-500)] ${disabledClass} ${className}`}
    >
      {/* Track */}
      <span className={`absolute inset-0 rounded-full transition-colors ${trackBgClass}`} />
      {/* Thumb */}
      <span
        className={`inline-block h-4 w-4 transform rounded-full shadow-lg ring-0 transition-transform duration-200 ease-in-out ${thumbPositionClass} ${thumbBgClass}`}
      />
    </button>
  );
};

export default Switch;