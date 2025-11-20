"use client";

import { useRouter } from 'next/navigation';
import LandingPage from './landing/LandingPage';
import TenantSelector from './tenant/TenantSelector';
import UserMenu from './ui/UserMenu';
import { Session } from 'next-auth';
import type { TenantWithBrandingAndSettings } from '@/lib/data';

interface HomePageClientProps {
  session: Session | null;
  tenants: TenantWithBrandingAndSettings[];
  allTenants: TenantWithBrandingAndSettings[];
}

export default function HomePageClient({ session, tenants, allTenants }: HomePageClientProps) {
  const router = useRouter();

  if (!session || !session.user) {
    return (
      <LandingPage
        onNavigateToLogin={() => router.push('/auth/login')}
        onSearch={(term) => router.push(`/explore?q=${term}`)}
      />
    );
  }

  const quickActions = [
    {
      title: 'Explore Temples',
      description: 'Browse every public tenant, compare creeds, and preview service details.',
      action: () => router.push('/explore'),
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-700" aria-hidden="true">
          <path fill="currentColor" d="M11 2 1 9l10 7 10-7-4-2.7V4h-2v1.26z" />
        </svg>
      ),
    },
    {
      title: 'Messages',
      description: 'Continue global DMs or jump into tenant chats with full moderation controls.',
      action: () => router.push('/messages'),
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-700" aria-hidden="true">
          <path fill="currentColor" d="M4 4h16v12H6l-4 4z" />
        </svg>
      ),
    },
    {
      title: 'Control Panel',
      description: 'Configure branding, features, donations, and volunteer needs for your tenants.',
      action: () => router.push('/account'),
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-700" aria-hidden="true">
          <path fill="currentColor" d="M12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4m0-6 3.09 5 5.91 1-4.5 4.45 1.06 6.22L12 16.77 6.44 18.67 7.5 12.45 3 8l5.91-1z" />
        </svg>
      ),
    },
  ];

  const planHighlights = [
    {
      title: 'Grid Calendar & Events',
      detail: 'Phase 4 is live—create RSVPs, open day modals, and keep congregants aligned.',
    },
    {
      title: 'Donations & Leaderboards',
      detail: 'Phase 8 unlocks donation modes, external links, and optional donor rankings.',
    },
    {
      title: 'Messaging + Notifications',
      detail: 'Global DMs, tenant chat, and a unified NotificationBell keep teams in sync.',
    },
  ];

  const memberTenants = tenants.slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f4ff] via-white to-[#fff8ee]">
      <header className="sticky top-0 z-10 border-b border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-600">Temple Platform</p>
            <h1 className="text-xl font-semibold text-slate-900">Find your temple, {session.user.name}</h1>
          </div>
          <UserMenu user={session.user} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.4fr,0.6fr]">
          <div className="rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-slate-100">
            <p className="text-sm font-semibold text-amber-600">Dashboard Overview</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Every tenant workflow in one place</h2>
            <p className="mt-3 text-sm text-slate-600">
              Membership approvals, messaging, donations, and community care are ready whenever you are. Keep stewarding each tenant
              with confidence knowing the backend is already wired.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {memberTenants.length ? (
                memberTenants.map((tenant) => (
                  <span key={tenant.id} className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1 text-xs font-medium text-amber-800">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {tenant.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">You have not joined a temple yet. Explore to get started.</span>
              )}
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-white/80 p-4 shadow-inner">
              <TenantSelector
                tenants={allTenants}
                onSelect={(tenantId) => router.push(`/tenants/${tenantId}`)}
                onCreateNew={() => router.push('/tenants/new')}
              />
            </div>
          </div>

          <div className="space-y-4">
            {quickActions.map((item) => (
              <button
                key={item.title}
                onClick={item.action}
                className="w-full rounded-2xl border border-slate-100 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                  {item.icon}
                  {item.title}
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {planHighlights.map((highlight) => (
            <div key={highlight.title} className="rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-white/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Platform highlights</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{highlight.title}</p>
              <p className="text-sm text-slate-600">{highlight.detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
