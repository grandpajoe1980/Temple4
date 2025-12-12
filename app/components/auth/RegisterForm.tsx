"use client"

import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import useTranslation from '@/app/hooks/useTranslation';

interface RegisterFormProps {
  onRegister: (displayName: string, email: string, pass: string) => Promise<{ success: boolean, message?: string }>;
  onNavigateToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onNavigateToLogin }) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    const result = await onRegister(displayName, email, password);
    if (!result.success) {
      setError(result.message || t('auth.registrationFailed'));
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card title={t('auth.createAccount')} description={t('auth.joinPlatform')}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}
          <Input
            id="displayName"
            name="displayName"
            label={t('auth.displayName')}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Input
            id="email"
            name="email"
            label={t('auth.emailAddress')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            name="password"
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-between items-center">
            <button type="button" onClick={onNavigateToLogin} className="text-sm text-amber-600 hover:text-amber-800 hover:underline">
              {t('auth.alreadyHaveAccount')}
            </button>
            <Button type="submit">{t('auth.register')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RegisterForm;
