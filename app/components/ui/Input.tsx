import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, containerClassName, className, ...props }) => {
  return (
    <div className={containerClassName}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800 mb-1">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm ${className ?? ''}`}
        {...props}
      />
    </div>
  );
};

export default Input;