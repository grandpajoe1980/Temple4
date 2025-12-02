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
  let communityResponse: Response | null = null;
  let servicesResponse: Response | null = null;
  let photosResponse: Response | null = null;
  let podcastsResponse: Response | null = null;
  let sermonsResponse: Response | null = null;
  let booksResponse: Response | null = null;
  try {
    [eventsResponse, postsResponse, communityResponse, servicesResponse, photosResponse, podcastsResponse, sermonsResponse, booksResponse] = await Promise.all([
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
      fetch(`${baseUrl}/api/tenants/${tenant.id}/community-posts?limit=3`, {
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/tenants/${tenant.id}/services`, {
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        cache: 'no-store',
      }),
      // additional tenant resources for the homepage carousel
      fetch(`${baseUrl}/api/tenants/${tenant.id}/photos?limit=3`, {
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/tenants/${tenant.id}/podcasts?limit=3`, {
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/tenants/${tenant.id}/sermons?limit=3`, {
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/tenants/${tenant.id}/books?limit=3`, {
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
    communityResponse = null;
    servicesResponse = null;
    photosResponse = null;
    podcastsResponse = null;
    sermonsResponse = null;
    booksResponse = null;
  }

  const eventDtos: EventResponseDto[] = eventsResponse && eventsResponse.ok ? await eventsResponse.json() : [];
  const upcomingEvents = eventDtos.map(mapEventDtoToClient);

  const postsJson = postsResponse && postsResponse.ok ? await postsResponse.json().catch(() => ({ posts: [] })) : { posts: [] };
  // API returns posts as PostResponseDto (with authorDisplayName/authorAvatarUrl).
  // Normalize to the shape expected by the client component (author.profile.displayName)
  const recentPosts = (postsJson.posts || []).map((post: any) => ({
    ...post,
    // If API returned an embedded author object use it, otherwise map authorDisplayName into the expected shape
    author: post.author ?? (post.authorDisplayName ? { profile: { displayName: post.authorDisplayName, avatarUrl: post.authorAvatarUrl ?? null } } : null),
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
  }));

  const communityJson = communityResponse && communityResponse.ok ? await communityResponse.json().catch(() => ({ posts: [] })) : { posts: [] };
  const recentCommunity = (communityJson.posts || []).map((p: any) => ({
    ...p,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
  }));

  const servicesJson = servicesResponse && servicesResponse.ok ? await servicesResponse.json().catch(() => ([])) : [];
  const services = servicesJson || [];

  const photosJson = photosResponse && photosResponse.ok ? await photosResponse.json().catch(() => ({ photos: [] })) : { photos: [] };
  const recentPhotos = (photosJson.photos || []).map((p: any) => ({ ...p }));

  const podcastsJson = podcastsResponse && podcastsResponse.ok ? await podcastsResponse.json().catch(() => ({ podcasts: [] })) : { podcasts: [] };
  const recentPodcasts = (podcastsJson.podcasts || []).map((p: any) => ({ ...p }));

  const sermonsJson = sermonsResponse && sermonsResponse.ok ? await sermonsResponse.json().catch(() => ({ sermons: [] })) : { sermons: [] };
  const recentSermons = (sermonsJson.sermons || []).map((s: any) => ({ ...s }));

  const booksJson = booksResponse && booksResponse.ok ? await booksResponse.json().catch(() => ({ books: [] })) : { books: [] };
  const recentBooks = (booksJson.books || []).map((b: any) => ({ ...b }));

  return (
    <HomePageClient
      tenant={tenant}
      user={user}
      membership={membership}
      upcomingEvents={upcomingEvents.filter((e: any) => e.startDateTime > new Date()).slice(0, 3)}
      recentPosts={recentPosts.slice(0, 3)}
      recentCommunity={recentCommunity.slice(0, 3)}
      services={services}
      recentPhotos={recentPhotos.slice(0,3)}
      recentPodcasts={recentPodcasts.slice(0,3)}
      recentSermons={recentSermons.slice(0,3)}
      recentBooks={recentBooks.slice(0,3)}
    />
  );
}
