

import React from 'react';

interface AvatarProps {
  icon: string;
  sizeClass?: string;
  bgColorClass?: string;
  iconColorClass?: string;
  iconSizeClass?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  icon,
  sizeClass = 'w-16 h-16',
  bgColorClass = 'bg-neutral-800',
  iconColorClass = 'text-neutral-400',
  iconSizeClass = 'text-4xl',
  className = '',
}) => {
  return (
    <div className={`${sizeClass} rounded-full grid place-items-center flex-shrink-0 ${bgColorClass} ${className}`}>
      <span className={`material-symbols-outlined ${iconColorClass} ${iconSizeClass}`}>
        {icon}
      </span>
    </div>
  );
};

export default Avatar;