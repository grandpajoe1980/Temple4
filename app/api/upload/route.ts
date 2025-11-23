/**
 * File Upload API Route (Phase F2)
 * 
 * POST /api/upload - Upload a file
 * 
 * Accepts multipart/form-data with:
 * - file: The file to upload
 * - tenantId: The tenant ID
 * - category: The file category (media, resources, photos, avatars)
 * 
 * Returns:
 * - url: Public URL to access the file
 * - storageKey: Internal storage key
 * - mimeType: File MIME type
 * - fileSize: File size in bytes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadFile, FileCategory } from '@/lib/storage';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { getMembershipForUserInTenant } from '@/lib/data';
import { TenantRole } from '@/types';
import { unauthorized, forbidden, validationError, handleApiError } from '@/lib/api-response';

/**
 * Map file category to required permission
 */
const CATEGORY_PERMISSIONS: Record<FileCategory, keyof import('@/lib/permissions').RolePermissions> = {
  media: 'canCreateSermons', // Media requires sermon/podcast creation permission
  resources: 'canUploadResources',
  photos: 'canCreatePosts', // Photos for gallery posts
  avatars: 'canCreatePosts', // Any member can upload avatar
};

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorized();
    }

    const userId = (session.user as any).id as string;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    // tenantId is optional for user-scoped uploads
    // tenantId is optional for user-scoped uploads. formData may contain the
    // literal string 'null' or an empty string from some callers — normalize
    // to `null` in those cases so downstream checks are reliable.
    const rawTenant = formData.get('tenantId');
    let tenantId: string | null = null;
    if (typeof rawTenant === 'string') {
      const t = rawTenant.trim();
      if (t !== '' && t !== 'null' && t !== 'undefined') {
        tenantId = t;
      }
    }
    const category = formData.get('category') as string | null;

    // Validation
    if (!file) {
      return validationError({ file: ['File is required'] });
    }

    // tenantId may be omitted for user-scoped uploads; require at least category

    if (!category || !['media', 'resources', 'photos', 'avatars'].includes(category)) {
      return validationError({
        category: ['Category must be one of: media, resources, photos, avatars'],
      });
    }

    // Get user from database (we need author info for mediaItem)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return unauthorized();

    // Permission checks: if tenantId provided, perform tenant permission checks; otherwise
    // allow authenticated user to upload user-scoped files (profile images etc.)
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) {
        return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
      }

      const purpose = formData.get('purpose') as string | null;
      if (purpose === 'facility') {
        if (!(user as any).isSuperAdmin) {
          const membership = await getMembershipForUserInTenant(userId, tenantId as string);
          const roles = (membership as any)?.roles ?? [];
          const isAllowedRole = roles.some((r: any) => r?.role === TenantRole.CLERGY || r?.role === TenantRole.ADMIN);
          if (!isAllowedRole) return forbidden('You do not have permission to upload facility images');
        }
      } else {
        const requiredPermission = CATEGORY_PERMISSIONS[category as FileCategory];
        const hasPermission = await can(user, tenant, requiredPermission);
        if (!hasPermission) return forbidden(`You do not have permission to upload ${category} files`);
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const result = await uploadFile(tenantId ?? undefined, buffer, category as FileCategory, file.type, file.name, userId);

    // Ensure the response includes a full public URL when only a storageKey is returned.
    // Use the request origin so clients receive an absolute URL they can post back
    // to the profile-posts endpoint without needing extra normalization.
    try {
      if ((!result.url || result.url === '') && result.storageKey) {
        const origin = new URL(request.url).origin;
        result.url = `${origin}/storage/${result.storageKey}`;
      }
    } catch (e) {
      // ignore origin construction failures and leave result as-is
    }

    // For photo uploads, create a MediaItem record so they can be listed in the gallery
    if (category === 'photos') {
      try {
        // Build data object and only include tenantId when provided to avoid
        // writing an explicit null which can violate DB constraints if the
        // schema hasn't been migrated locally.
        const data: any = {
          authorUserId: userId,
          type: 'PHOTO',
          title: file.name,
          description: '',
          embedUrl: '',
          storageKey: result.storageKey,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
          uploadedAt: result.uploadedAt,
        };

        if (tenantId) data.tenantId = tenantId;

        const mediaItem = await prisma.mediaItem.create({ data });

        return NextResponse.json({ ...result, mediaItem }, { status: 201 });
      } catch (e) {
        console.error('Failed to create mediaItem for photo upload', e);
        // Return upload result even if DB insertion fails
        return NextResponse.json(result, { status: 201 });
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    // Handle specific storage errors
    if (error.message.includes('Storage quota exceeded')) {
      return NextResponse.json(
        { message: error.message },
        { status: 413 } // Payload Too Large
      );
    }

    if (error.message.includes('Invalid file type')) {
      return validationError({ file: [error.message] });
    }

    if (error.message.includes('File too large')) {
      return validationError({ file: [error.message] });
    }

    return handleApiError(error, { route: 'POST /api/upload' });
  }
}
