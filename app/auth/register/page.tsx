'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      const errorMsg = 'Password must be at least 6 characters long.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName, email, password }),
      });

      if (response.ok) {
        toast.success('Account created successfully! Please log in.');
        router.push('/auth/login');
      } else {
        const data = await response.json();
        const errorMsg = data.message || 'Registration failed. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus();
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
            <Card title="Create an Account" description="Join the platform to connect with communities.">
                <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-md text-sm"
                  >
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
                    disabled={isSubmitting}
                />
                <Input 
                    id="email" 
                    name="email" 
                    label="Email Address"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                    disabled={isSubmitting}
                />
                <Input 
                    id="password" 
                    name="password" 
                    label="Password"
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                    disabled={isSubmitting}
                />
                <div className="flex justify-between items-center">
                    <button 
                      type="button" 
                      onClick={() => router.push('/auth/login')} 
                      className="text-sm text-amber-600 hover:text-amber-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      Already have an account?
                    </button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating Account...' : 'Register'}
                    </Button>
                </div>
                </form>
            </Card>
        </div>
    </div>
  );
};
