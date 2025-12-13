"use client"

import React from 'react';
import type { User } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import useTranslation from '@/app/hooks/useTranslation';

interface VolunteerNeedCardProps {
  need: any;
  currentUser: any;
  onUpdate: () => void;
}

const VolunteerNeedCard: React.FC<VolunteerNeedCardProps> = ({ need, currentUser, onUpdate }) => {
  const { t, lang } = useTranslation();
  const localeCode = lang === 'vi' ? 'vi-VN' : lang === 'es' ? 'es-ES' : 'en-US';
  const isUserSignedUp = need.signups.some((s: any) => s.user.id === currentUser.id);
  const isFull = need.signups.length >= need.slotsNeeded;

  const handleSignUp = async () => {
    try {
      const res = await fetch(`/api/volunteer-needs/${need.id}/signups`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to sign up');
      onUpdate();
    } catch (err) {
      console.error('Sign up failed', err);
      alert(t('volunteering.signupFailed'));
    }
  };

  const handleCancel = async () => {
    try {
      const res = await fetch(`/api/volunteer-needs/${need.id}/signups`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel signup');
      onUpdate();
    } catch (err) {
      console.error('Cancel signup failed', err);
      alert(t('volunteering.cancelFailed'));
    }
  };

  const SignupButton = () => {
    if (isUserSignedUp) {
      return (
        <Button variant="secondary" onClick={handleCancel}>
          {t('volunteering.cancelSignup')}
        </Button>
      );
    }
    if (isFull) {
      return <Button disabled>{t('volunteering.full')}</Button>;
    }
    return <Button onClick={handleSignUp}>{t('volunteering.signUp')}</Button>;
  };

  return (
    <Card className="!p-0 flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold tenant-text-primary">{need.date.toLocaleDateString(localeCode, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">{need.title}</h3>
            {need.location ? (
              <p className="mt-1 text-sm text-gray-500">{t('volunteering.location')}: {need.location}</p>
            ) : null}
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <span className="text-sm font-semibold bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md">
              {need.signups.length} / {need.slotsNeeded}
            </span>
            <p className="text-xs text-gray-500 mt-1">{t('volunteering.filled')}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          {need.description}
        </p>

        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase text-gray-500">{t('volunteering.volunteersSignedUp')}</h4>
          {need.signups.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {need.signups.map(({ user }: any) => (
                <UserLink key={user.id} userId={user.id} className="flex items-center space-x-2 bg-gray-100 rounded-full pr-3 py-1 inline-flex">
                  <Avatar src={(user.profile as any)?.avatarUrl || '/placeholder-avatar.svg'} name={(user.profile as any)?.displayName || user.email} size="xs" className="w-6 h-6" />
                  <span className="text-sm text-gray-800">{(user.profile as any)?.displayName || user.email}</span>
                </UserLink>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic mt-2">{t('volunteering.beFirst')}</p>
          )}
        </div>

      </div>
      <div className="bg-gray-50 px-6 py-4 text-right">
        <SignupButton />
      </div>
    </Card>
  );
};

export default VolunteerNeedCard;
