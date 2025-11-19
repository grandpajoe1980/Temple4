export type DocDescriptor = {
  slug: string;
  title: string;
  description: string;
  file: string;
};

export const DOC_PAGES: DocDescriptor[] = [
  {
    slug: 'security',
    title: 'Security & Compliance',
    description: 'Security audit notes and guidance for ongoing hardening.',
    file: 'SECURITY-AUDIT.md',
  },
  {
    slug: 'status',
    title: 'Release & Status',
    description: 'Current state snapshot and delivery progress.',
    file: 'CURRENT-STATE.md',
  },
];

export function getDocBySlug(slug: string) {
  return DOC_PAGES.find((doc) => doc.slug === slug);
}
