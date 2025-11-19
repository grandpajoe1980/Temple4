import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
  const baseClasses = "rounded-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";

  const variantClasses = {
    primary: 'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500 shadow-amber-600/20',
    secondary: 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 focus-visible:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-red-600/20',
  };

  const sizeClasses = {
      md: "px-4 py-2 text-sm",
      sm: "px-3 py-1.5 text-xs",
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
