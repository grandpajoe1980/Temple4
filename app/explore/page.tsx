import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchTerm = params?.q;
  redirect(searchTerm ? `/?q=${encodeURIComponent(searchTerm)}` : '/');
}
