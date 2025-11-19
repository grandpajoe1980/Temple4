import Link from 'next/link';
import { DOC_PAGES } from './doc-map';

export default function DocsLandingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Documentation</p>
        <h1 className="text-3xl font-semibold text-slate-900">Temple Platform Knowledge Base</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Centralized references for the project plan, security guardrails, and current delivery status. These pages mirror the
          markdown files in the <code>docs/</code> directory for quick access.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {DOC_PAGES.map((doc) => (
          <Link
            key={doc.slug}
            href={`/docs/${doc.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">{doc.title}</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{doc.description}</p>
            <p className="mt-3 text-xs font-medium text-slate-500">View details →</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-600">
        Looking for something else? Check the repository <code>docs/</code> folder for deep dives or reach out via
        <Link href="/support" className="font-semibold text-amber-700 hover:underline">
          {' '}support
        </Link>
        .
      </div>
    </div>
  );
}
