import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
  error?: boolean;
  errorMessage?: string;
  errorId?: string;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  id, 
  containerClassName, 
  className, 
  error,
  errorMessage,
  errorId,
  ...props 
}) => {
  const inputErrorId = errorId || (id ? `${id}-error` : undefined);
  
  return (
    <div className={containerClassName}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error && inputErrorId ? inputErrorId : undefined}
        className={`appearance-none block w-full px-3 py-2.5 border rounded-lg shadow-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary sm:text-sm transition-colors bg-background text-foreground ${
          error 
            ? 'border-destructive focus-visible:ring-destructive' 
            : 'border-input'
        } ${className ?? ''}`}
        {...props}
      />
      {error && errorMessage && inputErrorId && (
        <p id={inputErrorId} className="mt-1.5 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default Input;
