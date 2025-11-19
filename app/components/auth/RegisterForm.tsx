"use client"

import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface RegisterFormProps {
  onRegister: (displayName: string, email: string, pass: string) => Promise<{ success: boolean, message?: string }>;
  onNavigateToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onNavigateToLogin }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    const result = await onRegister(displayName, email, password);
    if (!result.success) {
      setError(result.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card title="Create an Account" description="Join the platform to connect with communities.">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-md text-sm">
                {error}
            </div>
          )}
          <Input 
            id="displayName" 
            name="displayName" 
            label="Display Name"
            type="text" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
            required 
          />
          <Input 
            id="email" 
            name="email" 
            label="Email Address"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            id="password" 
            name="password" 
            label="Password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
           <div className="flex justify-between items-center">
             <button type="button" onClick={onNavigateToLogin} className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
               Already have an account?
             </button>
            <Button type="submit">Register</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RegisterForm;
