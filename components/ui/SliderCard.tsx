import React from 'react';
import Slider from './Slider';

interface SliderCardProps {
  icon: string;
  label: string;
  onIconClick?: () => void;
  valueDisplay?: string | number;
  sliderProps?: {
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
  };
}

const SliderCard: React.FC<SliderCardProps> = ({ icon, label, onIconClick, sliderProps, valueDisplay }) => {
  const IconComponent = onIconClick ? 'button' : 'span';
  
  return (
    <div className="bg-neutral-800 rounded-lg p-3 flex items-center w-full text-left space-x-4">
      <div className="flex items-center gap-3 w-28 flex-shrink-0">
        <IconComponent 
            className="material-symbols-outlined text-2xl text-neutral-400 p-1 rounded-full hover:bg-neutral-700/50 transition-colors"
            onClick={onIconClick}
        >
            {icon}
        </IconComponent>
        <p className="font-semibold text-gray-200 text-lg truncate" title={label}>{label}</p>
      </div>
      {sliderProps && (
        <div className="flex-grow">
            <Slider {...sliderProps} />
        </div>
      )}
      {valueDisplay !== undefined && (
        <div className="w-12 text-right text-neutral-400 font-mono text-sm flex-shrink-0">
          {valueDisplay}
        </div>
      )}
    </div>
  );
};

export default SliderCard;