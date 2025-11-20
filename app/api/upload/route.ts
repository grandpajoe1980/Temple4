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
    const tenantId = formData.get('tenantId') as string | null;
    const category = formData.get('category') as string | null;

    // Validation
    if (!file) {
      return validationError({ file: ['File is required'] });
    }

    if (!tenantId) {
      return validationError({ tenantId: ['Tenant ID is required'] });
    }

    if (!category || !['media', 'resources', 'photos', 'avatars'].includes(category)) {
      return validationError({
        category: ['Category must be one of: media, resources, photos, avatars'],
      });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return unauthorized();
    }

    // Permission check
    const purpose = formData.get('purpose') as string | null;

    if (purpose === 'facility') {
      // Facility photos are only allowed for tenant CLERGY, tenant ADMIN, or platform superadmins
      if ((user as any).isSuperAdmin) {
        // allowed
      } else {
        const membership = await getMembershipForUserInTenant(userId, tenantId);
        const roles = (membership as any)?.roles ?? [];
        const isAllowedRole = roles.some((r: any) => r?.role === TenantRole.CLERGY || r?.role === TenantRole.ADMIN);
        if (!isAllowedRole) {
          return forbidden('You do not have permission to upload facility images');
        }
      }
    } else {
      const requiredPermission = CATEGORY_PERMISSIONS[category as FileCategory];
      const hasPermission = await can(user, tenant, requiredPermission);

      if (!hasPermission) {
        return forbidden(`You do not have permission to upload ${category} files`);
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const result = await uploadFile(
      tenantId,
      buffer,
      category as FileCategory,
      file.type,
      file.name
    );

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
