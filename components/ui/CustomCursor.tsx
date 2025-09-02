
import React, { useState, useEffect } from 'react';

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('mousemove', updatePosition);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        zIndex: 9999,
      }}
    >
      <div style={{ transform: 'translate(-50%, -50%)' }}>
        <div
          className="h-8 w-8 animate-rotate-continuously custom-cursor-spinner"
        />
      </div>
    </div>
  );
};

export default CustomCursor;
