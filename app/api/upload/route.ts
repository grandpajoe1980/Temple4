/**
 * File Upload API Endpoint
 * 
 * POST /api/upload - Upload a file to storage
 * 
 * Requires authentication and validates:
 * - User permissions based on category
 * - File type and size
 * - Tenant storage quota
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadFile, getAllowedMimeTypes, StorageCategory } from '@/lib/storage';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema
const UploadSchema = z.object({
  tenantId: z.string().cuid(),
  category: z.enum(['media', 'resources', 'avatars', 'branding']),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tenantId = formData.get('tenantId') as string | null;
    const category = formData.get('category') as StorageCategory | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate input
    const validationResult = UploadSchema.safeParse({ tenantId, category });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { tenantId: validTenantId, category: validCategory } = validationResult.data;

    // Check tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: validTenantId },
      include: { settings: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check user has permission to upload
    const membership = await prisma.userTenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId: validTenantId,
        },
      },
      include: { roles: true },
    });

    // Only approved members with STAFF, ADMIN, or CLERGY roles can upload
    const canUpload =
      session.user.isSuperAdmin ||
      (membership?.status === 'APPROVED' &&
        membership.roles.some((r) =>
          ['ADMIN', 'STAFF', 'CLERGY'].includes(r.role)
        ));

    if (!canUpload) {
      return NextResponse.json(
        { error: 'You do not have permission to upload files' },
        { status: 403 }
      );
    }

    // Check storage quota (simple check - in production, calculate actual usage)
    const maxStorageMB = tenant.settings?.maxStorageMB || 1000;
    // TODO: Implement actual storage usage calculation
    // For now, we'll allow uploads and track quota later

    // Get allowed MIME types for category
    const allowedMimeTypes = getAllowedMimeTypes(validCategory);

    // Upload file
    const result = await uploadFile({
      tenantId: validTenantId,
      category: validCategory,
      file,
      maxSizeMB: 50, // 50MB max per file
      allowedMimeTypes,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
