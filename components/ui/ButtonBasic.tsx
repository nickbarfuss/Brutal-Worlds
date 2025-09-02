import React from 'react';

// Reverting to native <button> which is best practice.
// Props are now for a button element.
interface ButtonBasicProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const ButtonBasic: React.FC<ButtonBasicProps> = ({ children, disabled, className, ...props }) => {
  // Base styles for the button.
  const baseClasses = "font-bold transition-all duration-300 rounded-full text-lg px-8 py-3";

  // State-dependent styles for enabled and disabled states.
  // The :disabled pseudo-class is used for native buttons.
  const stateClasses = disabled
    ? "bg-neutral-700 text-neutral-400"
    : "bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-500)]";

  return (
    // Use the native <button> element for semantics and accessibility.
    <button
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonBasic;