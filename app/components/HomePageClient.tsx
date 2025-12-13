"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from './ui/Logo';
import TenantCard from './explore/TenantCard';
import { Session } from 'next-auth';
import type { TenantWithBrandingAndSettings } from '@/lib/data';
import useTranslation from '@/app/hooks/useTranslation';

interface HomePageClientProps {
  session: Session | null;
  tenants: TenantWithBrandingAndSettings[];
  allTenants: TenantWithBrandingAndSettings[];
}

export default function HomePageClient({ session, tenants, allTenants }: HomePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  // Initialize search from URL query param
  const initialSearchTerm = searchParams?.get('q') ?? '';
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isSearching, setIsSearching] = useState(initialSearchTerm.length > 0);

  // Sync with URL query param changes
  useEffect(() => {
    const qParam = searchParams?.get('q') ?? '';
    if (qParam !== searchTerm) {
      setSearchTerm(qParam);
      setIsSearching(qParam.length > 0);
    }
  }, [searchParams]);

  // Toggle search mode based on input
  useEffect(() => {
    setIsSearching(searchTerm.length > 0);
  }, [searchTerm]);

  // Filter all tenants based on search term
  const filteredTenants = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    return allTenants.filter(tenant => {
      const name = tenant.name?.toLowerCase() || '';
      const creed = tenant.creed?.toLowerCase() || '';
      const description = tenant.description?.toLowerCase() || '';
      // Note: address is not included in TenantWithBrandingAndSettings, 
      // so we search by name, creed, and description
      return name.includes(term) || creed.includes(term) || description.includes(term);
    });
  }, [searchTerm, allTenants]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search happens inline - no navigation needed
  };

  const memberTenants = tenants;
  const isLoggedIn = session?.user;

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="animate-temple-float grid gap-8 lg:grid-cols-[1.4fr,0.6fr]" style={{ animationFillMode: 'both' }}>
          <div>
            <div className="flex flex-col items-center gap-6">
              {/* Logo and branding */}
              <div className="flex items-center gap-4 animate-temple-float" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                <Logo className="text-4xl md:text-6xl h-[1em] w-[1em] text-amber-600" />
                <h1 className="text-4xl md:text-6xl font-sans font-thin uppercase tracking-tight text-amber-600 animate-temple-fade dark:animate-temple-reveal">ASEMBLI</h1>
              </div>

              {/* Search form */}
              <form onSubmit={handleSubmit} className="w-full max-w-2xl animate-temple-float" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
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
                    aria-label={t('common.search')}
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('home.searchPlaceholder')}
                    className="w-full h-14 rounded-full border border-slate-200 bg-white pl-12 pr-16 text-base text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      aria-label={t('home.clearSearch')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </form>

              {/* Login prompt for logged-out users */}
              {!isLoggedIn && (
                <div className="text-center text-sm text-slate-500 animate-temple-float" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                  <button onClick={() => router.push('/auth/login')} className="text-amber-600 hover:underline font-medium">
                    {t('auth.signIn')}
                  </button>
                  {' '}{t('auth.signInToSee')}
                </div>
              )}

              {/* Content container with relative positioning for transitions */}
              <div className="mt-6 w-full relative animate-temple-float" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                {/* "Your communities" section - fades out when searching */}
                {isLoggedIn && memberTenants.length > 0 && (
                  <div className={`search-transition ${isSearching ? 'search-fade-out' : 'search-fade-in'}`}>
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <h2 className="text-lg font-semibold text-slate-900">{t('home.yourCommunities')}</h2>
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {memberTenants.length} {memberTenants.length === 1 ? t('common.membership') : t('common.memberships')}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Friends Card - Always first */}
                      <button
                        onClick={() => router.push('/friends')}
                        className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm ring-1 ring-blue-500/20 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:ring-blue-400/30"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-foreground">{t('navigation.friends')}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {t('home.seeWhatFriendsAreDoing')}
                          </span>
                        </div>
                      </button>

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

                                <img src={logoUrl} alt={`${tenant.name} logo`} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-lg font-semibold">{initial}</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-semibold text-slate-900">{tenant.name}</span>
                              <span className="text-xs text-slate-500 line-clamp-1">
                                {tenant.creed || t('common.memberCommunity')}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Friends card for logged-in users with no tenant memberships */}
                {isLoggedIn && memberTenants.length === 0 && !isSearching && (
                  <div className="search-transition search-fade-in">
                    <div className="mb-3">
                      <h2 className="text-lg font-semibold text-foreground">{t('home.quickLinks')}</h2>
                    </div>
                    <button
                      onClick={() => router.push('/friends')}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm ring-1 ring-blue-500/20 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:ring-blue-400/30"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">{t('navigation.friends')}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {t('home.seeWhatFriendsAreDoing')}
                        </span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Search results - fades in when searching */}
                {isSearching && (
                  <div className={`search-transition ${isSearching ? 'search-fade-in' : 'search-fade-out'}`}>
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {filteredTenants.length} {filteredTenants.length === 1 ? t('common.result') : t('common.results')} {t('common.noResults').split(' ')[0].toLowerCase() === 'no' ? 'found' : ''}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {t('home.showingResultsFor')} &ldquo;{searchTerm}&rdquo;
                      </p>
                    </div>

                    {filteredTenants.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                        {filteredTenants.map((tenant) => (
                          <TenantCard key={tenant.id} tenant={tenant as any} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-slate-100">
                        <h3 className="text-lg font-medium text-slate-900">{t('home.noCommunitiesFound')}</h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {t('home.noCommunitiesFoundDesc', { term: searchTerm })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state for logged-out users with no search */}
                {!isLoggedIn && !isSearching && (
                  <div className="text-center p-8">
                    <p className="text-slate-500">
                      {t('home.searchToGetStarted')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - could be used for additional content */}
        </section>
      </main>
    </div>
  );
}
