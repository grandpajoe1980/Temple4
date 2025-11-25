"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TempleLogo from './ui/TempleLogo';
import LandingPage from './landing/LandingPage';
import TenantSelector from './tenant/TenantSelector';
import { Session } from 'next-auth';
import type { TenantWithBrandingAndSettings } from '@/lib/data';

interface HomePageClientProps {
  session: Session | null;
  tenants: TenantWithBrandingAndSettings[];
  allTenants: TenantWithBrandingAndSettings[];
}

export default function HomePageClient({ session, tenants, allTenants }: HomePageClientProps) {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term) router.push(`/explore?q=${encodeURIComponent(term)}`);
  };

  if (!session || !session.user) {
    return (
      <LandingPage
        onNavigateToLogin={() => router.push('/auth/login')}
        onSearch={(term) => router.push(`/explore?q=${encodeURIComponent(term)}`)}
      />
    );
  }

  // quick actions removed per design

  // platform highlights removed per design

  const memberTenants = tenants;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f4ff] via-white to-[#fff8ee]">

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.4fr,0.6fr]">
          <div>
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <TempleLogo className="text-4xl md:text-6xl h-[1em] w-[1em] text-amber-600" />
                <h1 className="text-4xl md:text-6xl font-sans font-thin uppercase tracking-tight text-amber-600">TEMPLE</h1>
              </div>

              <form onSubmit={handleSubmit} className="w-full max-w-2xl">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M11 4a7 7 0 0 1 5.3 11.5l4 4-1.4 1.4-4-4A7 7 0 1 1 11 4zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
                      />
                    </svg>
                  </span>
                  <input
                    id="home-search"
                    aria-label="Search for a temple"
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for a temple by name, creed, or location..."
                    className="w-full h-14 rounded-full border border-slate-200 bg-white px-12 text-base text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </form>

              {memberTenants.length > 0 && (
                <div className="mt-6 w-full">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900">Your temples</h2>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {memberTenants.length} {memberTenants.length === 1 ? 'membership' : 'memberships'}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {memberTenants.map((tenant) => {
                      const logoUrl = tenant.branding?.logoUrl || '';
                      const initial = tenant.name?.slice(0, 1).toUpperCase() || '?';
                      return (
                        <button
                          key={tenant.id}
                          onClick={() => router.push(`/tenants/${tenant.id}`)}
                          className="group flex w-full items-center gap-4 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100 overflow-hidden">
                            {logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={logoUrl} alt={`${tenant.name} logo`} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-lg font-semibold">{initial}</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-slate-900">{tenant.name}</span>
                            <span className="text-xs text-slate-500 line-clamp-1">
                              {tenant.creed || 'Member community'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* quick actions removed */}
        </section>

        {/* Platform highlights removed */}
      </main>
    </div>
  );
}
