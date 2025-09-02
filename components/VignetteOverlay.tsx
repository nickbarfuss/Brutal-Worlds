import React from 'react';

const VignetteOverlay: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-10 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.8) 100%)',
      }}
      aria-hidden="true"
    />
  );
};

export default VignetteOverlay;