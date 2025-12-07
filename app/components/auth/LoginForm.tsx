"use client"

import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FormField } from '../ui/FormField';
import { useFormValidation } from '@/app/hooks/useFormValidation';
import { loginSchema, type LoginFormData } from '@/lib/validation';

interface LoginFormProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onNavigateToRegister, onNavigateToForgotPassword }) => {
  const {
    values,
    getFieldProps,
    getFieldError,
    handleSubmit,
    isSubmitting,
    submitError,
    setSubmitError,
  } = useFormValidation<LoginFormData>({
    schema: loginSchema,
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async (data) => {
      const success = await onLogin(data.email, data.password);
      if (!success) {
        setSubmitError('Invalid email or password.');
      }
    },
  });

  return (
    <div className="max-w-md mx-auto">
      <Card title="Platform Login" description="Enter your credentials to continue.">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {submitError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm" role="alert">
                {submitError}
            </div>
          )}
          <FormField 
            {...getFieldProps('email')}
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={getFieldError('email')}
            required
          />
          <FormField 
            {...getFieldProps('password')}
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={getFieldError('password')}
            required
          />
           <div className="text-right">
             <button 
               type="button" 
               onClick={onNavigateToForgotPassword} 
               className="text-sm text-amber-600 hover:text-amber-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
             >
               Forgot your password?
             </button>
           </div>
           <div className="flex justify-between items-center">
             <button 
               type="button" 
               onClick={onNavigateToRegister} 
               className="text-sm text-amber-600 hover:text-amber-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
             >
               Create an account
             </button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Login'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginForm;