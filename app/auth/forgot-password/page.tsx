'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
            <Card title="Forgot Password" description="Enter your email address and we'll send you a link to reset your password.">
                {submitted ? (
                <div className="text-center">
                    <div className="p-4 bg-green-100 border border-green-200 text-green-800 rounded-md text-sm">
                        <h3 className="font-semibold">Check your email</h3>
                        <p className="mt-1">If an account with that email exists, a password reset link has been sent.</p>
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                        <p>(For this prototype, you would check your email for a link.)</p>
                        <p>Since email sending is not implemented, you can proceed to reset password page directly for a known email.</p>
                         <Button variant="secondary" className="mt-2" onClick={() => router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)}>
                            Reset Password for {email}
                        </Button>
                    </div>
                    <button type="button" onClick={() => router.push('/auth/login')} className="mt-6 text-sm text-amber-600 hover:text-amber-800 hover:underline">
                    &larr; Back to Login
                    </button>
                </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input 
                    id="email" 
                    name="email" 
                    label="Email Address"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    autoFocus
                    />
                    <div className="flex justify-between items-center">
                    <button type="button" onClick={() => router.push('/auth/login')} className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
                        Back to Login
                    </button>
                    <Button type="submit">Send Reset Link</Button>
                    </div>
                </form>
                )}
            </Card>
        </div>
    </div>
  );
};
