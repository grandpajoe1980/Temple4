'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@temple.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl: '/',
    });

    if (result?.error) {
      setError('Invalid credentials. Please try again.');
    }
    // If successful, NextAuth will handle the redirect
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
            <Card title="Platform Login" description="Enter your credentials to continue.">
                <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-md text-sm">
                        {error}
                    </div>
                )}
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
                <div className="text-right">
                    <button type="button" onClick={() => router.push('/auth/forgot-password')} className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
                    Forgot your password?
                    </button>
                </div>
                <div className="flex justify-between items-center">
                    <button type="button" onClick={() => router.push('/auth/register')} className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
                    Create an account
                    </button>
                    <Button type="submit">Login</Button>
                </div>
                <div className="text-center text-xs text-gray-400 pt-4">
                    <p>For this prototype, use:</p>
                    <p>Email: <strong>admin@temple.com</strong> / Password: <strong>password</strong></p>
                    <p>Or any other user from the mock data.</p>
                </div>
                </form>
            </Card>
        </div>
    </div>
  );
};
