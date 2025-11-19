import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Support</p>
        <h1 className="text-3xl font-semibold text-slate-900">Need help with Temple Platform?</h1>
        <p className="text-sm text-slate-600">
          Use the resources below to report issues, request onboarding assistance, or follow along with the project plan.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Self-serve docs</h2>
          <p className="mt-2 text-sm text-slate-600">Read the latest plan, security notes, and delivery status.</p>
          <Link href="/docs" className="mt-4 inline-flex text-sm font-semibold text-amber-700 hover:underline">
            Browse documentation →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Report an issue</h2>
          <p className="mt-2 text-sm text-slate-600">Open a GitHub issue with steps to reproduce and expected behavior.</p>
          <a
            href="https://github.com/temple/platform/issues"
            className="mt-4 inline-flex text-sm font-semibold text-amber-700 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Go to GitHub Issues →
          </a>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Contact support</h2>
          <p className="mt-2 text-sm text-slate-600">
            Prefer a direct thread? Email <a className="font-semibold text-amber-700" href="mailto:support@temple.dev">support@temple.dev</a>{' '}
            and include your tenant ID or user email.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900">Service status</h2>
          <p className="mt-2 text-sm text-amber-900/80">
            Check the current rollout and uptime notes on the status page.
          </p>
          <Link href="/docs/status" className="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:underline">
            View status →
          </Link>
        </div>
      </div>
    </div>
  );
}
