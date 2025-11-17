'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName, email, password }),
    });

    if (response.ok) {
      router.push('/auth/login');
    } else {
      const data = await response.json();
      setError(data.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
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
                    <button type="button" onClick={() => router.push('/auth/login')} className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
                    Already have an account?
                    </button>
                    <Button type="submit">Register</Button>
                </div>
                </form>
            </Card>
        </div>
    </div>
  );
};
