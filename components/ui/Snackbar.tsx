
import React, { useState, useEffect } from 'react';

interface SnackbarProps {
  data: {
    icon: string;
    title: string;
    subtitle: string;
    iconColorClass?: string;
  } | null;
  duration?: number;
  onClose?: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ data, duration = 5, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [currentData, setCurrentData] = useState(data);

  useEffect(() => {
    if (data) {
      setCurrentData(data);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [data]);

  if (!currentData) return null;
  
  const animationStyle = {
    '--duration': `${duration}s`
  } as React.CSSProperties;

  return (
    <div 
        onAnimationEnd={() => { if (!visible) setCurrentData(null) }}
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md bg-neutral-800 rounded-lg shadow-lg text-center pointer-events-auto overflow-hidden z-30 ${visible ? 'animate-slide-in-up' : 'animate-slide-out-down'}`}>
      <div className="w-full h-1 bg-neutral-700">
        <div 
          className="h-full bg-neutral-600"
          style={{ animation: visible ? `shrink-width var(--duration) linear forwards` : 'none' }}
        ></div>
      </div>
      <div className="relative p-4">
        <div className={`flex items-center justify-center font-bold text-xl ${currentData.iconColorClass || 'text-white'}`}>
          <span className="material-symbols-outlined mr-2 text-4xl">{currentData.icon}</span>
          {currentData.title}
        </div>
        <div className="text-base text-neutral-300 mt-1">
          {currentData.subtitle}
        </div>
        {onClose && (
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-neutral-500 hover:text-white transition-colors p-1 rounded-full"
                aria-label="Close"
            >
                <span className="material-symbols-outlined">close</span>
            </button>
        )}
      </div>
    </div>
  );
};

// Add a simple keyframe animation to the component's style scope for the progress bar
const styles = document.createElement('style');
styles.innerHTML = `
  @keyframes shrink-width {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(styles);


export default Snackbar;
