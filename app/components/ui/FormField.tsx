"use client";

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Field label */
  label: string;
  /** Error message to display */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional wrapper class */
  wrapperClassName?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      size = 'md',
      wrapperClassName,
      className,
      id,
      name,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const fieldId = id || name || label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;
    
    const sizeClasses = {
      sm: 'h-8 text-sm px-2.5',
      md: 'h-10 text-base px-3',
      lg: 'h-12 text-lg px-4',
    };
    
    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        <label
          htmlFor={fieldId}
          className={cn(
            'block text-sm font-medium text-foreground',
            error && 'text-destructive'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
        
        <input
          ref={ref}
          id={fieldId}
          name={name || fieldId}
          type={type}
          className={cn(
            'w-full rounded-lg border bg-background text-foreground placeholder:text-muted-foreground transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            sizeClasses[size],
            error
              ? 'border-destructive focus-visible:ring-destructive/50'
              : 'border-input hover:border-muted-foreground/50',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          required={required}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="text-sm text-destructive flex items-center gap-1" role="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 flex-shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        
        {!error && helperText && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Field label */
  label: string;
  /** Error message to display */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional wrapper class */
  wrapperClassName?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      size = 'md',
      wrapperClassName,
      className,
      id,
      name,
      ...props
    },
    ref
  ) => {
    const fieldId = id || name || label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;
    
    const sizeClasses = {
      sm: 'text-sm px-2.5 py-2 min-h-[80px]',
      md: 'text-base px-3 py-2.5 min-h-[100px]',
      lg: 'text-lg px-4 py-3 min-h-[120px]',
    };
    
    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        <label
          htmlFor={fieldId}
          className={cn(
            'block text-sm font-medium text-foreground',
            error && 'text-destructive'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
        
        <textarea
          ref={ref}
          id={fieldId}
          name={name || fieldId}
          className={cn(
            'w-full rounded-lg border bg-background text-foreground placeholder:text-muted-foreground transition-colors resize-y',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            sizeClasses[size],
            error
              ? 'border-destructive focus-visible:ring-destructive/50'
              : 'border-input hover:border-muted-foreground/50',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          required={required}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="text-sm text-destructive flex items-center gap-1" role="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 flex-shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        
        {!error && helperText && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export default FormField;
