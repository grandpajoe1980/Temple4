/**
 * File Delete API Endpoint
 * 
 * DELETE /api/upload/[key] - Delete a file from storage
 * 
 * Requires admin permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deleteFile } from '@/lib/storage';
import { prisma } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { key } = await params;
    
    // Decode storage key (it may be URL encoded)
    const storageKey = decodeURIComponent(key);

    // Parse tenant ID from storage key (format: uploads/[tenantId]/[category]/[filename])
    const pathParts = storageKey.split('/');
    if (pathParts.length < 3 || pathParts[0] !== 'uploads') {
      return NextResponse.json(
        { error: 'Invalid storage key' },
        { status: 400 }
      );
    }

    const tenantId = pathParts[1];

    // Check user has admin permission for this tenant
    if (!session.user.isSuperAdmin) {
      const membership = await prisma.userTenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId: session.user.id,
            tenantId,
          },
        },
        include: { roles: true },
      });

      const isAdmin = membership?.roles.some((r) => r.role === 'ADMIN');
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin permission required' },
          { status: 403 }
        );
      }
    }

    // Delete file
    const deleted = await deleteFile(storageKey);

    if (!deleted) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}
