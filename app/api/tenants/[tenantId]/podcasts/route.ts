import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';
import { detectPodcast } from '@/lib/podcast';

async function fetchOEmbed(endpoint: string) {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

function parseMetaFromHtml(html: string) {
  const titleMatch = /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html);
  const imgMatch = /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html);
  const twitterImg = /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html);
  const descMatch = /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html);
  const twitterDesc = /<meta[^>]+name=["']twitter:description["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html);
  const title = titleMatch ? titleMatch[1] : undefined;
  const image = imgMatch ? imgMatch[1] : twitterImg ? twitterImg[1] : undefined;
  const description = descMatch ? descMatch[1] : twitterDesc ? twitterDesc[1] : undefined;
  return { title, image, description };
}

async function fetchMetadataForUrl(url: string) {
  try {
    const info = detectPodcast(url);
    // Apple Podcasts: use iTunes Lookup API when we have a podcast id
    if (info.provider === 'apple' && info.podcastId) {
      try {
        const lookup = `https://itunes.apple.com/lookup?id=${info.podcastId}`;
        const r = await fetch(lookup);
        if (r.ok) {
          const j = await r.json();
          if (j.results && j.results.length > 0) {
            const res = j.results[0];
            return { title: res.collectionName || res.trackName, image: res.artworkUrl600 || res.artworkUrl100, description: res.collectionExplicitness || undefined };
          }
        }
      } catch (e) {
        // fall through to generic fetch
      }
    }
    if (info.provider === 'youtube') {
      const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const o = await fetchOEmbed(endpoint);
      if (o) return { title: o.title, image: o.thumbnail_url };
    }
    if (info.provider === 'spotify') {
      const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
      const o = await fetchOEmbed(endpoint);
      if (o) return { title: o.title, image: o.thumbnail_url };
    }

    const res = await fetch(url);
    const text = await res.text();
    const parsed = parseMetaFromHtml(text);
    return { title: parsed.title, image: parsed.image };
  } catch (err) {
    return null;
  }
}

// 12.1 List Podcasts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, tenantId, 'podcasts');
    if (!canView) {
      return forbidden('You do not have permission to view podcasts.');
    }

    const podcasts = await prisma.mediaItem.findMany({
      where: {
        tenantId: tenantId,
        type: 'PODCAST_AUDIO',
        deletedAt: null, // Filter out soft-deleted podcasts
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Enrich with artwork/title using metadata lookup (best-effort)
    const enriched = await Promise.all(
      podcasts.map(async (podcast) => {
        let artwork: string | undefined = undefined;
        let metaTitle: string | undefined = undefined;
        let metaDescription: string | undefined = undefined;
        try {
          const meta = await fetchMetadataForUrl(podcast.embedUrl);
          if (meta?.image) artwork = meta.image;
          if (meta?.title) metaTitle = meta.title;
          if ((meta as any)?.description) metaDescription = (meta as any).description;
        } catch (e) {
          // ignore per-item failures
        }

        // Prefer stored title/description, but fall back to metadata when missing or placeholder
        const titleFromRecord = podcast.title && podcast.title.trim() && podcast.title.toLowerCase() !== 'untitled' ? podcast.title : (metaTitle || podcast.title);
        const descFromRecord = podcast.description && podcast.description.trim() ? podcast.description : (metaDescription || podcast.description);

        return {
          ...podcast,
          title: titleFromRecord,
          description: descFromRecord,
          authorDisplayName: podcast.author.profile?.displayName || 'Unknown',
          authorAvatarUrl: podcast.author.profile?.avatarUrl || undefined,
          artworkUrl: artwork,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error(`Failed to fetch podcasts for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/podcasts', tenantId });
  }
}

const podcastSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    embedUrl: z.string().url(),
});

// 12.2 Create Podcast
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ 
        where: { id: tenantId },
        select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true }
    });

    if (!user || !tenant) {
      return validationError({ tenant: ['Invalid user or tenant'] });
    }

    const canCreate = await can(user, tenant, 'canCreatePodcasts');
    if (!canCreate) {
      return forbidden('You do not have permission to create podcasts.');
    }

    const result = podcastSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const newPodcast = await prisma.mediaItem.create({
            data: {
                title: result.data.title,
                description: result.data.description || '',
                embedUrl: result.data.embedUrl,
                tenantId: tenantId,
                authorUserId: userId,
                type: 'PODCAST_AUDIO',
            },
        });

        return NextResponse.json(newPodcast, { status: 201 });
    } catch (error) {
      console.error(`Failed to create podcast in tenant ${tenantId}:`, error);
      return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/podcasts', tenantId });
    }
}
