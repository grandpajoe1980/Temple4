/**
 * Delete File API Route (Phase F2)
 * 
 * DELETE /api/upload/delete - Delete an uploaded file
 * 
 * Body:
 * - storageKey: The storage key of the file to delete
 * - tenantId: The tenant ID that owns the file
 * 
 * Only admins or the file owner can delete files.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deleteFile } from '@/lib/storage';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { unauthorized, forbidden, validationError, handleApiError, notFound } from '@/lib/api-response';

export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorized();
    }

    const userId = (session.user as any).id as string;

    // Parse request body
    const body = await request.json();
    const { storageKey, tenantId } = body;

    // Validation
    if (!storageKey) {
      return validationError({ storageKey: ['Storage key is required'] });
    }

    if (!tenantId) {
      return validationError({ tenantId: ['Tenant ID is required'] });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return notFound('Tenant');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return unauthorized();
    }

    // Extract tenant ID from storage key to verify it matches
    const keyParts = storageKey.split('/');
    if (keyParts.length < 2 || keyParts[0] !== tenantId) {
      return forbidden('Storage key does not belong to this tenant');
    }

    // Permission check - must be admin or moderator to delete files
    const isAdmin = await can(user, tenant, 'canBanMembers'); // Admin-level permission
    const isModerator = await can(user, tenant, 'canModeratePosts');

    // Check if user is the file owner
    let isOwner = false;

    // Check in MediaItem
    const mediaItem = await prisma.mediaItem.findFirst({
      where: { storageKey, authorUserId: userId },
    });

    // Check in ResourceItem
    const resourceItem = await prisma.resourceItem.findFirst({
      where: { storageKey, uploaderUserId: userId },
    });

    isOwner = !!(mediaItem || resourceItem);

    // Must be admin, moderator, or owner
    if (!isAdmin && !isModerator && !isOwner) {
      return forbidden('You do not have permission to delete this file');
    }

    // Delete the file
    const deleted = await deleteFile(storageKey);

    if (!deleted) {
      return notFound('File');
    }

    // Update database records to remove storage key
    // (Keep the record for audit but clear storage references)
    await prisma.mediaItem.updateMany({
      where: { storageKey },
      data: {
        storageKey: null,
        fileSize: null,
        mimeType: null,
      },
    });

    await prisma.resourceItem.updateMany({
      where: { storageKey },
      data: {
        storageKey: null,
        fileSize: null,
        mimeType: null,
      },
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    return handleApiError(error, {
      route: 'DELETE /api/upload/delete',
    });
  }
}
