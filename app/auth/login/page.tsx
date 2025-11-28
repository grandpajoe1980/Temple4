'use client';

import React, { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { useToast } from '@/app/components/ui/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@temple.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorMsg = 'Invalid credentials. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
      } else if (result?.ok) {
        toast.success('Login successful! Redirecting...');
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      const errorMsg = 'An error occurred during login. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error && errorRef.current) {
      // Move focus to the error region so screen readers announce it
      errorRef.current.focus();
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="mb-8 flex items-center gap-3 text-slate-900">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 text-amber-600">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
              <path fill="currentColor" d="M12 2 2 9l1.5.84V21h6v-6h5v6h6V9.84L22 9z" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Temple</p>
            <p className="text-xl font-semibold text-slate-900">Platform Login</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start">
          <Card title="Platform Login" description="Enter your credentials to continue.">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div
                  ref={errorRef}
                  tabIndex={-1}
                  role="alert"
                  className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-md text-sm"
                >
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
                disabled={loading}
              />
              <Input
                id="password"
                name="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot-password')}
                  className="text-amber-600 hover:text-amber-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Forgot your password?
                </button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Need an account?</span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/auth/register')}
                  disabled={loading}
                  className="px-4"
                >
                  Create an account
                </Button>
              </div>
              <div className="text-sm text-slate-500 pt-2 space-y-1">
                <p className="font-semibold text-slate-700">For this prototype, use:</p>
                <p>
                  Email: <strong>admin@temple.com</strong> / Password: <strong>password</strong>
                </p>
                <p>Or any other user from the mock data.</p>
              </div>
            </form>
          </Card>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 text-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Need platform access?</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Admin access</span>
            </div>
            <p className="text-sm text-slate-600">
              Platform admin accounts oversee tenants, feature toggles, and billing. Ask your Temple implementation partner if you need an invite.
            </p>
            <p className="text-sm text-slate-600">
              You can still explore tenants as a member or guest after logging in with any seeded account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
