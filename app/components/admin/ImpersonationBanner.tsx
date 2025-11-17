import React from 'react';
import type { User } from '../../types';
import Button from '../ui/Button';

interface ImpersonationBannerProps {
  originalUser: User;
  impersonatedUser: User;
  onExit: () => void;
}

const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({ originalUser, impersonatedUser, onExit }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-2 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2 text-sm font-semibold">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              {/* FIX: Access displayName from the nested profile object. */}
              You ({originalUser.profile.displayName}) are currently impersonating <strong>{impersonatedUser.profile.displayName}</strong>.
            </span>
        </div>
        <Button variant="secondary" size="sm" onClick={onExit} className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 focus:ring-yellow-300">
          Exit Impersonation
        </Button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
