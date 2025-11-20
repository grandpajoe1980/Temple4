import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTenantById, getUserById, getMembershipForUserInTenant } from '@/lib/data';
import HomePageClient from '@/app/components/tenant/HomePageClient'; // This will be the client component
import { EventResponseDto, mapEventDtoToClient } from '@/lib/services/event-service';

export default async function TenantHomePage({ params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  const tenant = await getTenantById(resolvedParams.tenantId);
  
  if (!tenant) {
    redirect('/');
  }

  const session = await getServerSession(authOptions);
  let user = null;
  let membership = null;

  if (session && session.user) {
    user = await getUserById(session.user.id);
    if (user) {
      membership = await getMembershipForUserInTenant(user.id, tenant.id);
    }
  }

  // If not public and not logged in, redirect (layout handles this too, but good for safety)
  if (!tenant.settings?.isPublic && !user) {
    redirect(`/auth/login?callbackUrl=/tenants/${tenant.id}`);
  }

  let cookieHeader = '';
  try {
    const cookieStore = await cookies();
    if (cookieStore && typeof (cookieStore as any).getAll === 'function') {
      const all = (cookieStore as any).getAll();
      cookieHeader = Array.isArray(all) ? all.map((c: any) => `${c.name}=${c.value}`).join('; ') : '';
    } else if (cookieStore && typeof cookieStore.toString === 'function') {
      // fallback to original behaviour when available
      cookieHeader = cookieStore.toString();
    } else {
      // Best-effort: try to get a common auth cookie
      const maybe = cookieStore?.get?.('next-auth.session-token') || cookieStore?.get?.('next-auth.callback-url');
      cookieHeader = maybe ? `${maybe.name}=${maybe.value}` : '';
    }
  } catch (err) {
    cookieHeader = '';
  }
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let eventsResponse: Response | null = null;
  let postsResponse: Response | null = null;
  try {
    [eventsResponse, postsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/tenants/${tenant.id}/events`, {
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/tenants/${tenant.id}/posts?limit=3`, {
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        cache: 'no-store',
      }),
    ]);
  } catch (fetchErr) {
    eventsResponse = null;
    postsResponse = null;
  }

  const eventDtos: EventResponseDto[] = eventsResponse && eventsResponse.ok ? await eventsResponse.json() : [];
  const upcomingEvents = eventDtos.map(mapEventDtoToClient);

  const postsJson = postsResponse && postsResponse.ok ? await postsResponse.json().catch(() => ({ posts: [] })) : { posts: [] };
  const recentPosts = (postsJson.posts || []).map((post: any) => ({
    ...post,
    author: post.author ?? null,
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
  }));

  return (
    <HomePageClient
      tenant={tenant}
      user={user}
      membership={membership}
      upcomingEvents={upcomingEvents.filter((e: any) => e.startDateTime > new Date()).slice(0, 3)}
      recentPosts={recentPosts.slice(0, 3)}
    />
  );
}
