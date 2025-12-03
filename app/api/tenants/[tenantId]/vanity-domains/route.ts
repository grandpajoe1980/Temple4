import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';
import crypto from 'crypto';

const createDomainSchema = z.object({
  domain: z.string().min(1).max(253).regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/, 'Invalid domain format'),
  domainType: z.enum(['FULL_DOMAIN', 'SUBDOMAIN', 'PATH_PREFIX']).default('FULL_DOMAIN'),
  isPrimary: z.boolean().default(false),
  forceHttps: z.boolean().default(true),
  wwwRedirect: z.enum(['add_www', 'remove_www']).nullable().optional(),
});

// GET: List vanity domains for tenant
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });

    const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if feature is enabled
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    const settings = tenant?.settings as Record<string, unknown> | null;
    if (!settings?.enableVanityDomains) {
      return NextResponse.json({ error: 'Vanity domains are not enabled for this tenant' }, { status: 403 });
    }

    const domains = await prisma.vanityDomain.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ domains });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Create a new vanity domain
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });

    const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if feature is enabled
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    const settings = tenant?.settings as Record<string, unknown> | null;
    if (!settings?.enableVanityDomains) {
      return NextResponse.json({ error: 'Vanity domains are not enabled for this tenant' }, { status: 403 });
    }

    const body = await req.json();
    const data = createDomainSchema.parse(body);

    // Check for domain uniqueness
    const existingDomain = await prisma.vanityDomain.findFirst({
      where: { domain: data.domain.toLowerCase(), deletedAt: null },
    });

    if (existingDomain) {
      return NextResponse.json({ error: 'This domain is already in use' }, { status: 409 });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // If setting as primary, unset other primaries
    if (data.isPrimary) {
      await prisma.vanityDomain.updateMany({
        where: { tenantId, isPrimary: true, deletedAt: null },
        data: { isPrimary: false },
      });
    }

    const domain = await prisma.vanityDomain.create({
      data: {
        tenantId,
        domain: data.domain.toLowerCase(),
        domainType: data.domainType,
        isPrimary: data.isPrimary,
        verificationToken,
        verificationMethod: 'TXT',
        forceHttps: data.forceHttps,
        wwwRedirect: data.wwwRedirect ?? null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      domain,
      verification: {
        type: 'TXT',
        name: `_temple-verify.${data.domain}`,
        value: verificationToken,
        instructions: `Add a TXT record with name "_temple-verify.${data.domain}" and value "${verificationToken}" to your DNS settings.`,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
