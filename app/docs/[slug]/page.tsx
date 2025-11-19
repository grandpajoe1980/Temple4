import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DOC_PAGES, getDocBySlug } from '../doc-map';

async function loadDocContent(file: string) {
  const fullPath = path.join(process.cwd(), 'docs', file);
  try {
    return await fs.readFile(fullPath, 'utf8');
  } catch (error) {
    console.error(`Unable to load doc content for ${file}`, error);
    return null;
  }
}

export default async function DocDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const doc = getDocBySlug(resolvedParams.slug);

  if (!doc) {
    return notFound();
  }

  const content = await loadDocContent(doc.file);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Link href="/docs" className="text-sm font-medium text-amber-700 hover:underline">
        ← Back to docs
      </Link>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Documentation</p>
        <h1 className="text-3xl font-semibold text-slate-900">{doc.title}</h1>
        <p className="text-sm text-slate-600">{doc.description}</p>
        <p className="text-xs text-slate-500">Source: docs/{doc.file}</p>
      </header>

      {content ? (
        <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm leading-6 text-slate-800">
          {content}
        </pre>
      ) : (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 p-6 text-sm text-amber-800">
          The source markdown file could not be loaded. Please check the repository docs directory.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Related pages</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {DOC_PAGES.filter((related) => related.slug !== doc.slug).map((related) => (
            <Link
              key={related.slug}
              href={`/docs/${related.slug}`}
              className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
            >
              {related.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
