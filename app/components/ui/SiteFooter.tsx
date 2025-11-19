import Link from 'next/link';

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Security', href: '/docs/security' },
      { label: 'Status', href: '/docs/status' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Explore Tenants', href: '/explore' },
      { label: 'Create Tenant', href: '/tenants/new' },
      { label: 'Messages', href: '/messages' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', href: '/support' },
      { label: 'Docs', href: '/docs' },
      { label: 'Report an issue', href: 'https://github.com/temple/platform/issues' },
    ],
  },
];

const statusItems = [
  { label: 'Environment', key: 'env' },
  { label: 'Build', key: 'build' },
  { label: 'Support', key: 'support', href: '/support' },
];

const SiteFooter = () => {
  const environmentLabel = process.env.NODE_ENV?.toUpperCase() || 'UNKNOWN';
  const buildLabel = process.env.NEXT_PUBLIC_GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev';

  return (
    <footer className="border-t border-white/30 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Temple Platform</p>
            <h2 className="mt-3 text-2xl font-semibold">Bring clarity to every tenant experience</h2>
            <p className="mt-2 text-sm text-white/80">
              Spin up a new tenant, or return to the control panel and continue the rollout outlined in the UI improvement plan.
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm font-semibold sm:flex-row">
              <Link
                href="/tenants/new"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-2 text-slate-900 shadow-sm transition hover:bg-amber-50"
              >
                Create a tenant
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/40 px-5 py-2 text-white transition hover:border-white hover:bg-white/10"
              >
                Log in to dashboard
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/60">SOC 2 ready • GDPR aligned • Backups every 15 minutes</p>
          </div>
          <div className="grid gap-8 text-left text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
            {footerSections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">{section.title}</p>
                <ul className="mt-3 space-y-1">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-slate-500 transition hover:text-slate-900"
                        aria-label={`${link.label} link`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 border-t border-slate-100/80 pt-6 text-xs text-slate-500">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusItems.map((item) => {
                const value =
                  item.key === 'env'
                    ? environmentLabel
                    : item.key === 'build'
                      ? buildLabel
                      : 'Temple Support';
                const badge = (
                  <span className="flex items-center gap-2 rounded-full border border-slate-200/80 px-4 py-1.5">
                    <span className="font-semibold uppercase tracking-[0.2em] text-amber-600">{item.label}</span>
                    <span className="font-medium text-slate-700">{value}</span>
                  </span>
                );
                return item.href ? (
                  <Link key={item.key} href={item.href} className="hover:text-slate-900">
                    {badge}
                  </Link>
                ) : (
                  <span key={item.key} className="inline-flex">
                    {badge}
                  </span>
                );
              })}
            </div>
            <p>&copy; {new Date().getFullYear()} Temple Platform</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
