
import React, { useCallback, useRef, useEffect } from 'react';

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

const Slider: React.FC<SliderProps> = ({ min, max, step, value, onChange, className, disabled = false }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const getPercentage = useCallback(() => {
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  const handleInteraction = useCallback((clientX: number) => {
    if (!trackRef.current || disabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const pos = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, pos / rect.width));
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    
    onChange(Math.max(min, Math.min(max, steppedValue)));
  }, [disabled, min, max, step, onChange]);

  const handlePointerMove = useCallback((moveEvent: PointerEvent) => {
      handleInteraction(moveEvent.clientX);
  }, [handleInteraction]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    isDraggingRef.current = true;
    handleInteraction(e.clientX);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  
  // FIX: This useEffect is critical for preventing memory leaks and "Uncaught" errors.
  // The original implementation had a faulty condition that failed to remove event
  // listeners if the component unmounted during a specific race condition. This fix
  // ensures the listeners are *always* cleaned up on unmount, preventing stale
  // event handlers from firing and causing a crash.
  useEffect(() => {
      return () => {
          // The cleanup must be unconditional. If the component unmounts for any reason,
          // we must assume that listeners might have been attached to the global `window`
          // object and that they must be removed to prevent memory leaks or crashes.
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
      };
  }, [handlePointerMove, handlePointerUp]);

  const disabledClasses = disabled ? 'opacity-50' : 'group';

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      className={`relative w-full h-5 flex items-center ${disabledClasses} ${className}`}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-disabled={disabled}
    >
      {/* Track */}
      <div className="relative w-full h-1 bg-neutral-700 rounded-full">
        {/* Fill */}
        <div
          className={`absolute h-full rounded-full ${disabled ? 'bg-neutral-600' : 'bg-[var(--color-accent-600)]'}`}
          style={{ width: `${getPercentage()}%` }}
        />
      </div>
      {/* Thumb */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full transition-transform duration-100 ${disabled ? 'bg-neutral-500' : 'bg-[var(--color-accent-500)] group-hover:scale-110'}`}
        style={{ left: `${getPercentage()}%`, transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
};

export default Slider;