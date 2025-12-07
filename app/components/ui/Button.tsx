import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses =
    'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'tenant-active-strong text-[color:var(--primary-foreground)] border-transparent hover:opacity-95',
    secondary: 'bg-card border-border text-[color:var(--primary-hex, rgb(var(--primary-rgb)))] hover:tenant-active',
    outline: 'bg-transparent border-[color:var(--primary-hex, rgb(var(--primary-rgb)))] text-[color:var(--primary-hex, rgb(var(--primary-rgb)))] hover:tenant-active-strong',
    ghost: 'bg-transparent border-transparent text-[color:var(--primary-hex, rgb(var(--primary-rgb)))] hover:tenant-active shadow-none',
    danger: 'bg-destructive text-white border-transparent hover:bg-destructive/90',
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
