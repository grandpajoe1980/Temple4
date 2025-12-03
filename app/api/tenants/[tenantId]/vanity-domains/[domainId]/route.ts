import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';

const updateDomainSchema = z.object({
  isPrimary: z.boolean().optional(),
  forceHttps: z.boolean().optional(),
  wwwRedirect: z.enum(['add_www', 'remove_www']).nullable().optional(),
  redirectToSlug: z.boolean().optional(),
});

// GET: Get a specific vanity domain
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; domainId: string }> }
) {
  try {
    const { tenantId, domainId } = await context.params;
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

    const domain = await prisma.vanityDomain.findFirst({
      where: { id: domainId, tenantId, deletedAt: null },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Include verification instructions if pending
    let verification = null;
    if (domain.status === 'PENDING_VERIFICATION') {
      verification = {
        type: domain.verificationMethod,
        name: `_temple-verify.${domain.domain}`,
        value: domain.verificationToken,
        instructions: `Add a TXT record with name "_temple-verify.${domain.domain}" and value "${domain.verificationToken}" to your DNS settings.`,
        attempts: domain.verificationAttempts,
        lastCheck: domain.lastVerificationCheck,
      };
    }

    return NextResponse.json({ domain, verification });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH: Update a vanity domain
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; domainId: string }> }
) {
  try {
    const { tenantId, domainId } = await context.params;
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

    const existingDomain = await prisma.vanityDomain.findFirst({
      where: { id: domainId, tenantId, deletedAt: null },
    });

    if (!existingDomain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const body = await req.json();
    const data = updateDomainSchema.parse(body);

    // If setting as primary, unset other primaries
    if (data.isPrimary) {
      await prisma.vanityDomain.updateMany({
        where: { tenantId, isPrimary: true, deletedAt: null, id: { not: domainId } },
        data: { isPrimary: false },
      });
    }

    const domain = await prisma.vanityDomain.update({
      where: { id: domainId },
      data: {
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
        ...(data.forceHttps !== undefined && { forceHttps: data.forceHttps }),
        ...(data.wwwRedirect !== undefined && { wwwRedirect: data.wwwRedirect }),
        ...(data.redirectToSlug !== undefined && { redirectToSlug: data.redirectToSlug }),
      },
    });

    return NextResponse.json({ domain });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

// DELETE: Remove a vanity domain
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; domainId: string }> }
) {
  try {
    const { tenantId, domainId } = await context.params;
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

    const existingDomain = await prisma.vanityDomain.findFirst({
      where: { id: domainId, tenantId, deletedAt: null },
    });

    if (!existingDomain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.vanityDomain.update({
      where: { id: domainId },
      data: { 
        deletedAt: new Date(),
        disabledAt: new Date(),
        disabledReason: 'Deleted by admin',
      },
    });

    return NextResponse.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
