"use client";

import React, { useState } from 'react';
import Button from '../ui/Button';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onSearch: (term: string) => void;
}

const statHighlights = [
  { label: 'Temples & Communities', value: '2,400+', detail: 'Across every creed and tradition' },
  { label: 'Messages Delivered', value: '1.2M', detail: 'Tenant chats and global DMs' },
  { label: 'Donations Facilitated', value: '$18M', detail: 'Tracked through Temple dashboards' },
];

const featureHighlights = [
  {
    title: 'Curated Tenant Spaces',
    description:
      'Create branded homebases with custom colors, banners, navigation, and welcome flows for each community.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3c-.4 0-.8.12-1.15.36L3 9v10.5A1.5 1.5 0 0 0 4.5 21H9v-5.5h6V21h4.5a1.5 1.5 0 0 0 1.5-1.5V9l-7.85-5.64A1.94 1.94 0 0 0 12 3z"
        />
      </svg>
    ),
  },
  {
    title: 'Events & Grid Calendar',
    description:
      'Plan services, retreats, and volunteer rallies with a grid-style calendar and RSVP-ready event cards.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 2v2H5a2 2 0 0 0-2 2v3h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zM3 11v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9zm4 3h4v4H7z"
        />
      </svg>
    ),
  },
  {
    title: 'Content & Broadcasts',
    description:
      'Sermons, podcasts, books, and live streams live side by side so members never miss a message.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600" aria-hidden="true">
        <path fill="currentColor" d="M4 5h16v14H4zm3 2v10h2V7zm5 0v10h6V7z" />
      </svg>
    ),
  },
  {
    title: 'Donations & Care',
    description:
      'Collect offerings with integrated donation flows, donor leaderboards, and contact touchpoints.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600" aria-hidden="true">
        <path fill="currentColor" d="M12 5.69 5 12.19V21h5v-4h4v4h5v-8.81z" />
      </svg>
    ),
  },
];

const journeyItems = [
  {
    title: 'Discover',
    description:
      'Search by creed, neighborhood, or languages spoken. Preview public profiles before requesting membership.',
  },
  {
    title: 'Belong',
    description:
      'Chat with members, join small groups, RSVP for events, and follow along with sermons and study plans.',
  },
  {
    title: 'Serve & Give',
    description:
      'Answer volunteer calls, donate toward shared goals, and share prayer requests and resources securely.',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-b from-white via-[#f4efff] to-[#fdfbf5] py-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 text-center sm:px-6 lg:px-8">
        <header className="flex flex-col items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-100">
            Platform Spec • Find your temple, Find yourself
          </span>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-14 w-14 text-amber-600">
                <path fill="currentColor" d="M12 2 2 9l1.5.84V21h6v-6h5v6h6V9.84L22 9z" />
              </svg>
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">Temple</h1>
            </div>
            <p className="max-w-3xl text-lg text-slate-600">
              Temple is the multi-tenant spiritual OS outlined in the master project plan. Launch beautiful community hubs,
              orchestrate events with a grid calendar, broadcast sermons, and coordinate care from one secure command center.
            </p>
          </div>
        </header>

        <form onSubmit={handleSearchSubmit} className="mx-auto w-full max-w-3xl rounded-2xl bg-white/90 p-4 shadow-xl ring-1 ring-slate-100 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M11 4a7 7 0 0 1 5.3 11.5l4 4-1.4 1.4-4-4A7 7 0 1 1 11 4zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
                  />
                </svg>
              </span>
              <input
                aria-label="Search for a temple"
                type="search"
                placeholder="Search temples by name, creed, or location"
                className="w-full rounded-xl border border-slate-200 bg-white px-12 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" className="rounded-xl px-6 py-3 text-base shadow-sm">
              Find my temple
            </Button>
          </div>
        </form>

        <div className="grid gap-4 text-left sm:grid-cols-3">
          {statHighlights.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur">
              <p className="text-sm font-medium text-amber-700">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.detail}</p>
            </div>
          ))}
        </div>

        <section className="grid gap-6 text-left md:grid-cols-2">
          {featureHighlights.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-3 rounded-2xl border border-transparent bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:border-amber-200">
              <div className="flex items-center gap-3">
                {feature.icon}
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              </div>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-amber-50 to-white/90 p-6 text-left shadow-inner ring-1 ring-amber-100">
          <h2 className="text-2xl font-semibold text-slate-900">Member journey, anchored in the Temple playbook</h2>
          <p className="mt-2 text-sm text-slate-600">
            Every experience outlined in projectplan.md is accounted for—search, membership workflows, donations, contact forms,
            and moderation-ready messaging.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {journeyItems.map((item, index) => (
              <div key={item.title} className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Step {index + 1}</span>
                <p className="mt-2 text-base font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-slate-600">Already guiding a community on Temple?</p>
          <Button variant="secondary" className="px-6" onClick={onNavigateToLogin}>
            Log in to the Control Panel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
