import Link from 'next/link';

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Project Plan', href: '/docs/projectplan' },
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

const SiteFooter = () => {
  const environmentLabel = process.env.NODE_ENV?.toUpperCase() || 'UNKNOWN';
  const buildLabel = process.env.NEXT_PUBLIC_GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev';

  return (
    <footer className="border-t border-white/30 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
        <div className="mt-6 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Environment: {environmentLabel}</p>
          <p>Build: {buildLabel}</p>
          <p>&copy; {new Date().getFullYear()} Temple Platform</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
