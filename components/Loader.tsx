
import React from 'react';

interface LoaderProps {
  text: string;
  hasError?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ text, hasError = false }) => {
  const title = hasError ? 'Error' : 'Brutal Worlds';
  const titleColor = hasError ? 'text-red-500' : 'text-neutral-100';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-900">
      {hasError ? (
        <span className="material-symbols-outlined text-red-500 text-4xl mb-4">error</span>
      ) : (
        <div className="h-8 w-8 mb-4 border-4 border-neutral-700 border-t-neutral-100 rounded-full animate-rotate-continuously"></div>
      )}
      <h1 className={`text-3xl font-bold ${titleColor}`}>{title}</h1>
      <p className="mt-2 text-lg text-neutral-400">{text}</p>
    </div>
  );
};

export default Loader;