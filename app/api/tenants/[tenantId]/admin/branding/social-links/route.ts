import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { forbidden, handleApiError, notFound, unauthorized, validationError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { enforceRateLimit } from '@/lib/rate-limit';
import { hasRole } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { ActionType, TenantRole } from '@/types';

/** Social link type for JSON storage */
interface SocialLink {
  platform: string;
  url: string;
  label?: string;
  showInFooter?: boolean;
}

/** Type guard to check if a value is a valid social link object */
function isSocialLink(value: unknown): value is SocialLink {
  return (
    typeof value === 'object' &&
    value !== null &&
    'platform' in value &&
    typeof (value as SocialLink).platform === 'string' &&
    'url' in value &&
    typeof (value as SocialLink).url === 'string'
  );
}

/** Parse socialLinks JSON to typed array, filtering out invalid entries */
function parseSocialLinks(json: unknown): SocialLink[] {
  if (!Array.isArray(json)) return [];
  return json.filter(isSocialLink);
}

const secureUrl = z.string().url().refine((value) => value.startsWith('https://'), {
  message: 'URL must use https://',
});

const socialLinkSchema = z.object({
  platform: z.string().min(1),
  url: secureUrl,
  label: z.string().optional(),
  showInFooter: z.boolean().optional(),
});

const partialUpdateSchema = z
  .object({
    platform: z.string().min(1),
    url: secureUrl.optional(),
    label: z.string().optional(),
    showInFooter: z.boolean().optional(),
  })
  .refine((value) => value.url || value.label !== undefined || value.showInFooter !== undefined, {
    message: 'At least one field must be provided for update',
  });

const rateLimitConfig = { limit: 30, windowMs: 60 * 1000 };

async function getContext(params: { tenantId: string }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user) {
    return { error: unauthorized() } as const;
  }

  const isAdmin = await hasRole(user.id, params.tenantId, [TenantRole.ADMIN]);
  if (!isAdmin) {
    return { error: forbidden('You do not have permission to manage social links.') } as const;
  }

  return { userId: user.id } as const;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const context = await getContext(resolvedParams);
  if ('error' in context) return context.error;

  const rateLimit = enforceRateLimit(`social-links:${context.userId}:${resolvedParams.tenantId}:GET`, rateLimitConfig);
  if (rateLimit) return rateLimit;

  try {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId: resolvedParams.tenantId },
      select: { socialLinks: true },
    });

    if (!branding) {
      return notFound('Tenant branding');
    }

    return NextResponse.json(branding.socialLinks || []);
  } catch (error) {
    return handleApiError(error, {
      route: 'GET /api/tenants/[tenantId]/admin/branding/social-links',
      tenantId: resolvedParams.tenantId,
      userId: context.userId,
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const context = await getContext(resolvedParams);
  if ('error' in context) return context.error;

  const rateLimit = enforceRateLimit(`social-links:${context.userId}:${resolvedParams.tenantId}:POST`, rateLimitConfig);
  if (rateLimit) return rateLimit;

  const result = socialLinkSchema.safeParse(await request.json());
  if (!result.success) {
    return validationError(result.error.flatten().fieldErrors);
  }

  try {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId: resolvedParams.tenantId },
      select: { id: true, socialLinks: true },
    });

    if (!branding) {
      return notFound('Tenant branding');
    }

    const socialLinks = parseSocialLinks(branding.socialLinks);
    const exists = socialLinks.some((link) => link.platform === result.data.platform);

    if (exists) {
      return validationError({ platform: ['A link with this platform already exists'] }, 'Duplicate platform');
    }

    socialLinks.push(result.data);

    const updated = await prisma.tenantBranding.update({
      where: { tenantId: resolvedParams.tenantId },
      data: { socialLinks: socialLinks as unknown as Prisma.InputJsonValue },
      select: { socialLinks: true },
    });

    await logAuditEvent({
      actorUserId: context.userId,
      actionType: ActionType.TENANT_BRANDING_SOCIAL_LINK_CREATED,
      entityType: 'TenantBranding',
      entityId: branding.id,
      metadata: { tenantId: resolvedParams.tenantId, platform: result.data.platform },
    });

    return NextResponse.json(updated.socialLinks || []);
  } catch (error) {
    return handleApiError(error, {
      route: 'POST /api/tenants/[tenantId]/admin/branding/social-links',
      tenantId: resolvedParams.tenantId,
      userId: context.userId,
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const context = await getContext(resolvedParams);
  if ('error' in context) return context.error;

  const rateLimit = enforceRateLimit(`social-links:${context.userId}:${resolvedParams.tenantId}:PATCH`, rateLimitConfig);
  if (rateLimit) return rateLimit;

  const result = partialUpdateSchema.safeParse(await request.json());
  if (!result.success) {
    return validationError(result.error.flatten().fieldErrors);
  }

  try {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId: resolvedParams.tenantId },
      select: { id: true, socialLinks: true },
    });

    if (!branding) {
      return notFound('Tenant branding');
    }

    const socialLinks = parseSocialLinks(branding.socialLinks);
    const index = socialLinks.findIndex((link) => link.platform === result.data.platform);

    if (index === -1) {
      return notFound('Social link');
    }

    const updatedLink = { ...socialLinks[index], ...result.data };
    socialLinks[index] = updatedLink;

    const updated = await prisma.tenantBranding.update({
      where: { tenantId: resolvedParams.tenantId },
      data: { socialLinks: socialLinks as unknown as Prisma.InputJsonValue },
      select: { socialLinks: true },
    });

    await logAuditEvent({
      actorUserId: context.userId,
      actionType: ActionType.TENANT_BRANDING_SOCIAL_LINK_UPDATED,
      entityType: 'TenantBranding',
      entityId: branding.id,
      metadata: { tenantId: resolvedParams.tenantId, platform: result.data.platform },
    });

    return NextResponse.json(updated.socialLinks || []);
  } catch (error) {
    return handleApiError(error, {
      route: 'PATCH /api/tenants/[tenantId]/admin/branding/social-links',
      tenantId: resolvedParams.tenantId,
      userId: context.userId,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const context = await getContext(resolvedParams);
  if ('error' in context) return context.error;

  const rateLimit = enforceRateLimit(`social-links:${context.userId}:${resolvedParams.tenantId}:DELETE`, rateLimitConfig);
  if (rateLimit) return rateLimit;

  const body = await request.json().catch(() => ({}));
  const platform = typeof body.platform === 'string' ? body.platform : '';
  if (!platform) {
    return validationError({ platform: ['Platform is required for delete'] });
  }

  try {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId: resolvedParams.tenantId },
      select: { id: true, socialLinks: true },
    });

    if (!branding) {
      return notFound('Tenant branding');
    }

    const socialLinks = parseSocialLinks(branding.socialLinks);
    const nextSocialLinks = socialLinks.filter((link) => link.platform !== platform);

    if (nextSocialLinks.length === socialLinks.length) {
      return notFound('Social link');
    }

    const updated = await prisma.tenantBranding.update({
      where: { tenantId: resolvedParams.tenantId },
      data: { socialLinks: nextSocialLinks as unknown as Prisma.InputJsonValue },
      select: { socialLinks: true },
    });

    await logAuditEvent({
      actorUserId: context.userId,
      actionType: ActionType.TENANT_BRANDING_SOCIAL_LINK_DELETED,
      entityType: 'TenantBranding',
      entityId: branding.id,
      metadata: { tenantId: resolvedParams.tenantId, platform },
    });

    return NextResponse.json(updated.socialLinks || []);
  } catch (error) {
    return handleApiError(error, {
      route: 'DELETE /api/tenants/[tenantId]/admin/branding/social-links',
      tenantId: resolvedParams.tenantId,
      userId: context.userId,
    });
  }
}
