import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MembershipStatus,  } from '@/types';
import { TenantRole } from '@/types';
import { z } from 'zod';

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
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  const currentUserId = (session.user as any).id;

  const json = await request.json();
  const result = tenantCreateSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, slug, ...restOfData } = result.data;

  try {
    // Check if slug is unique
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return NextResponse.json({ message: 'A tenant with this slug already exists.' }, { status: 409 });
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
            donationSettings: {},
            liveStreamSettings: {},
            visitorVisibility: {},
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
      },
    });

    return NextResponse.json(newTenant, { status: 201 });
  } catch (error) {
    console.error('Failed to create tenant:', error);
    return NextResponse.json({ message: 'Failed to create tenant' }, { status: 500 });
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
        return NextResponse.json({ message: 'Failed to fetch tenants' }, { status: 500 });
    }
}
