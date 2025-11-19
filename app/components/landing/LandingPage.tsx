"use client";

import React, { useState } from 'react';
import Button from '../ui/Button';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onSearch: (term: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl space-y-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200 text-amber-600">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
                <path fill="currentColor" d="M12 2 2 9l1.5.84V21h6v-6h5v6h6V9.84L22 9z" />
              </svg>
            </span>
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Temple</p>
              <p className="text-3xl font-bold tracking-tight text-slate-900">Find your temple, Find yourself</p>
            </div>
          </div>
          <p className="max-w-2xl text-base text-slate-600">
            Search across every temple, denomination, and city. Preview services, connect with members, and join the communities that feel like home.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-3 rounded-2xl bg-white/80 p-3 shadow-lg ring-1 ring-slate-200 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <label className="sr-only" htmlFor="landing-search">
              Search for a temple
            </label>
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M11 4a7 7 0 0 1 5.3 11.5l4 4-1.4 1.4-4-4A7 7 0 1 1 11 4zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
                />
              </svg>
            </span>
            <input
              id="landing-search"
              aria-label="Search for a temple"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a temple by name, creed, or location..."
              className="w-full h-14 rounded-full border border-slate-200 bg-white px-12 text-base text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <Button type="submit" className="h-14 rounded-full px-6 text-base font-semibold shadow-md">
            Search
          </Button>
        </form>

        <div className="flex flex-col items-center gap-2 text-sm text-slate-600">
          <p>Already a platform administrator?</p>
          <Button variant="secondary" className="rounded-full px-5" onClick={onNavigateToLogin}>
            Login to Manage
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
