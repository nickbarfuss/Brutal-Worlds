import React from 'react';

interface BackdropProps {
  isClosing?: boolean;
}

const Backdrop: React.FC<BackdropProps> = ({ isClosing = false }) => {
  const animationClass = isClosing ? 'animate-close-backdrop' : 'animate-open-backdrop';
  return (
    <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm ${animationClass}`} />
  );
};

export default Backdrop;