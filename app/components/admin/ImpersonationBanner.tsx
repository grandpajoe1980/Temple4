'use client';

import React from 'react';
import Button from '../ui/Button';

interface ImpersonationBannerProps {
  originalName: string;
  impersonatedName: string;
  onExit: () => void;
  isEnding?: boolean;
}

const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({ originalName, impersonatedName, onExit, isEnding }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 px-4 py-2 text-yellow-900 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-2 text-sm font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            You ({originalName}) are currently impersonating <strong>{impersonatedName}</strong>.
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onExit}
          disabled={isEnding}
          className="bg-yellow-50 text-yellow-800 hover:bg-yellow-100 focus:ring-yellow-300"
        >
          {isEnding ? 'Ending...' : 'Exit Impersonation'}
        </Button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
