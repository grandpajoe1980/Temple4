"use client"

import React from 'react';
import { signUpForNeed, cancelSignUp } from '@/lib/data';
import type { UserWithProfileSettings, VolunteerNeedWithSignups } from '@/lib/data';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface VolunteerNeedCardProps {
  need: VolunteerNeedWithSignups;
  currentUser: UserWithProfileSettings;
  onUpdate: () => void;
}

const VolunteerNeedCard: React.FC<VolunteerNeedCardProps> = ({ need, currentUser, onUpdate }) => {
  const isUserSignedUp = need.signups.some(s => s.user.id === currentUser.id);
  const isFull = need.signups.length >= need.slotsNeeded;

  const handleSignUp = async () => {
    await signUpForNeed(need.id, currentUser.id);
    onUpdate();
  };

  const handleCancel = async () => {
    await cancelSignUp(need.id, currentUser.id);
    onUpdate();
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
                <p className="text-sm font-semibold text-amber-600">{need.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <h3 className="mt-1 text-xl font-semibold text-gray-900">{need.title}</h3>
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
                    {need.signups.map(({ user }) => (
                        <div key={user.id} className="flex items-center space-x-2 bg-gray-100 rounded-full pr-3 py-1">
                            <img src={user.profile.avatarUrl || '/placeholder-avatar.svg'} alt={user.profile.displayName} className="w-6 h-6 rounded-full"/>
                            <span className="text-sm text-gray-800">{user.profile.displayName}</span>
                        </div>
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
