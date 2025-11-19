import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses =
    'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-amber-600 text-white hover:bg-amber-700',
    secondary: 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-none',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  } as const;

  const sizeClasses = {
    md: 'px-4 py-2',
    sm: 'px-3 py-1.5 text-xs',
  } as const;

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;
