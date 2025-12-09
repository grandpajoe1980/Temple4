"use client"

import React from 'react';
import type { User } from '@/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';

interface VolunteerNeedCardProps {
  need: any;
  currentUser: any;
  onUpdate: () => void;
}

const VolunteerNeedCard: React.FC<VolunteerNeedCardProps> = ({ need, currentUser, onUpdate }) => {
  const isUserSignedUp = need.signups.some((s: any) => s.user.id === currentUser.id);
  const isFull = need.signups.length >= need.slotsNeeded;

  const handleSignUp = async () => {
    try {
      const res = await fetch(`/api/volunteer-needs/${need.id}/signups`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to sign up');
      onUpdate();
    } catch (err) {
      console.error('Sign up failed', err);
      alert('Failed to sign up for this need');
    }
  };

  const handleCancel = async () => {
    try {
      const res = await fetch(`/api/volunteer-needs/${need.id}/signups`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel signup');
      onUpdate();
    } catch (err) {
      console.error('Cancel signup failed', err);
      alert('Failed to cancel signup');
    }
  };

  const SignupButton = () => {
    if (isUserSignedUp) {
      return (
        <Button variant="secondary" onClick={handleCancel}>
          Cancel Signup
        </Button>
      );
    }
    if (isFull) {
      return <Button disabled>Full</Button>;
    }
    return <Button onClick={handleSignUp}>Sign Up</Button>;
  };

  return (
    <Card className="!p-0 flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
                <div>
                <p className="text-sm font-semibold tenant-text-primary">{need.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <h3 className="mt-1 text-xl font-semibold text-gray-900">{need.title}</h3>
                {need.location ? (
                  <p className="mt-1 text-sm text-gray-500">Location: {need.location}</p>
                ) : null}
            </div>
            <div className="text-right flex-shrink-0 ml-4">
                <span className="text-sm font-semibold bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md">
                   {need.signups.length} / {need.slotsNeeded}
                </span>
                <p className="text-xs text-gray-500 mt-1">Filled</p>
            </div>
        </div>
        
        <p className="mt-4 text-sm text-gray-600">
          {need.description}
        </p>

        <div className="mt-6">
            <h4 className="text-xs font-bold uppercase text-gray-500">Volunteers Signed Up:</h4>
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
                <p className="text-sm text-gray-500 italic mt-2">Be the first to sign up!</p>
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
