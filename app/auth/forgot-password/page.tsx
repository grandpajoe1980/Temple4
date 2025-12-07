'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
    const submittedRef = React.useRef<HTMLDivElement | null>(null);
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

    React.useEffect(() => {
        if (submitted && submittedRef.current) submittedRef.current.focus();
    }, [submitted]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full">
            <Card title="Forgot Password" description="Enter your email address and we'll send you a link to reset your password.">
                {submitted ? (
                <div className="text-center">
                    <div ref={submittedRef} tabIndex={-1} role="status" className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-md text-sm">
                        <h3 className="font-semibold">Check your email</h3>
                        <p className="mt-1">If an account with that email exists, a password reset link has been sent.</p>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                        <p>(For this prototype, you would check your email for a link.)</p>
                        <p>Since email sending is not implemented, you can proceed to reset password page directly for a known email.</p>
                         <Button variant="secondary" className="mt-2" onClick={() => router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)}>
                            Reset Password for {email}
                        </Button>
                    </div>
                    <button type="button" onClick={() => router.push('/auth/login')} className="mt-6 text-sm text-primary hover:text-primary/80 hover:underline">
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
                    <button type="button" onClick={() => router.push('/auth/login')} className="text-sm text-primary hover:text-primary/80 hover:underline">
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
