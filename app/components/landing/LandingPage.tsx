"use client";
import React, { useState } from 'react';
import Button from '../ui/Button';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onSearch: (term: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 py-10">
      <div className="flex items-center space-x-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L1 9l4 2.18v6.32L12 22l7-4.5V11.18L23 9l-3-1.68V5h-2v1.32L12 2zm0 16.5l-5-3.25V11.4l5 2.75v5.6zM12 12L7 9.25 12 6.5 17 9.25 12 12z"/>
        </svg>
        <h1 className="text-6xl font-bold text-gray-800 tracking-tight">Temple</h1>
      </div>
      <p className="mt-4 text-xl text-gray-500">
        Find your temple, Find yourself
      </p>

      <form onSubmit={handleSearchSubmit} className="mt-12 w-full max-w-2xl">
        <div className="relative">
          <input
            type="search"
            placeholder="Search for a temple by name, creed, or location..."
            className="w-full px-5 py-4 border border-gray-300 rounded-full shadow-sm focus:ring-amber-500 focus:border-amber-500 text-lg bg-white text-gray-900 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
            <Button
              type="submit"
              className="rounded-full !px-6"
            >
              Search
            </Button>
          </div>
        </div>
      </form>
      
      <div className="mt-16">
        <p className="text-gray-600">Already a platform administrator?</p>
        <Button
            variant="secondary"
            className="mt-2"
            onClick={onNavigateToLogin}
        >
            Login to Manage
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;