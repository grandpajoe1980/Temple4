import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MembershipStatus, } from '@/types';
import { TenantRole } from '@/types';
import { z } from 'zod';
import { handleApiError, unauthorized, validationError, conflict } from '@/lib/api-response';

const tenantCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  creed: z.string().min(1, "Creed is required"),
  slug: z.string().min(3, "Slug must be at least 3 characters long").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

// 7.1 Create Tenant
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return unauthorized();
  }
  const currentUserId = (session.user as any).id;

  const json = await request.json();
  const result = tenantCreateSchema.safeParse(json);

  if (!result.success) {
    return validationError(result.error.flatten().fieldErrors);
  }

  const { name, slug, ...restOfData } = result.data;

  try {
    // Check if slug is unique
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return conflict('A tenant with this slug already exists.');
    }

    const newTenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        creed: restOfData.creed,
        street: restOfData.street || '',
        city: restOfData.city || '',
        state: restOfData.state || '',
        country: restOfData.country || '',
        postalCode: restOfData.postalCode || '',
        description: restOfData.description || '',
        // Default settings and branding
        branding: {
          create: {},
        },
        settings: {
          create: {
            isPublic: true,
            donationSettings: {},
            liveStreamSettings: {},
            visitorVisibility: {
              calendar: true,
              posts: true,
              sermons: true,
              podcasts: true,
              books: true,
              prayerWall: true,
            },
            enablePrayerWall: true,
            enableSmallGroups: true,
            enableVolunteering: true,
            enableDonations: true,
            enableTrips: false,
            enableTripFundraising: false,
            tripCalendarColor: '#0EA5E9',
          },
        },
        // Add the creator as the first member and admin
        memberships: {
          create: {
            userId: currentUserId,
            status: MembershipStatus.APPROVED,
            roles: {
              create: {
                role: TenantRole.ADMIN,
                isPrimary: true,
              },
            },
          },
        },
        permissions: {
          ADMIN: {
            canCreatePosts: true,
            canCreateEvents: true,
            canCreateSermons: true,
            canCreatePodcasts: true,
            canCreateBooks: true,
            canCreateGroupChats: true,
            canInviteMembers: true,
            canApproveMembership: true,
            canBanMembers: true,
            canModeratePosts: true,
            canModerateChats: true,
            canPostInAnnouncementChannels: true,
            canManagePrayerWall: true,
            canUploadResources: true,
            canManageResources: true,
            canManageContactSubmissions: true,
            canManageFacilities: true,
          },
          MEMBER: {
            canCreatePosts: true,
            canCreateEvents: false,
            canCreateSermons: false,
            canCreatePodcasts: false,
            canCreateBooks: false,
            canCreateGroupChats: true,
            canInviteMembers: false,
            canApproveMembership: false,
            canBanMembers: false,
            canModeratePosts: false,
            canModerateChats: false,
            canPostInAnnouncementChannels: false,
            canManagePrayerWall: false,
            canUploadResources: false,
            canManageResources: false,
            canManageContactSubmissions: false,
            canManageFacilities: false,
          },
        },
      },
    });

    return NextResponse.json(newTenant, { status: 201 });
  } catch (error) {
    console.error('Failed to create tenant:', error);
    return handleApiError(error, { route: 'POST /api/tenants' });
  }
}

// 7.3 List/Search Tenants
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
        settings: {
          isPublic: true, // Only search public tenants
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });

    const totalTenants = await prisma.tenant.count({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
        settings: {
          isPublic: true,
        }
      },
    });

    return NextResponse.json({
      tenants,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalTenants / limit),
        totalResults: totalTenants,
      }
    });
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    return handleApiError(error, { route: 'GET /api/tenants' });
  }
}
