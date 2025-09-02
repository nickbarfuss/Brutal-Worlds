
import React from 'react';

interface ChipProps {
  label?: string;
  value: string;
  bgColorClass?: string;
  labelColorClass?: string;
  valueColorClass?: string;
}

const Chip: React.FC<ChipProps> = ({
  label,
  value,
  bgColorClass = 'bg-neutral-800',
  labelColorClass = 'text-neutral-400',
  valueColorClass = 'text-neutral-50',
}) => {
  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bgColorClass}`}>
      {label && <span className={`mr-1.5 ${labelColorClass}`}>{label}</span>}
      <span className={valueColorClass}>{value}</span>
    </div>
  );
};

export default Chip;
