/**
 * Database Configuration API
 * 
 * Manages DATABASE_URL in the encrypted secrets store.
 * Only accessible by platform admins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSecret, setSecret, hasSecret, loadSecretsToEnv } from '@/lib/secrets';

// GET: Check database configuration status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only platform admins can access this
    if (!session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 });
    }
    
    // Check if master password is configured
    const hasMasterPassword = !!process.env.SECRETS_MASTER_PASSWORD;
    
    // Check if DATABASE_URL exists in secrets
    const hasDbUrl = hasMasterPassword && hasSecret('DATABASE_URL');
    
    // Get current DATABASE_URL (masked) - either from secrets or env
    let currentDbUrl = process.env.DATABASE_URL || '';
    let source: 'secrets' | 'env' | 'none' = 'none';
    
    if (hasDbUrl) {
      source = 'secrets';
      currentDbUrl = getSecret('DATABASE_URL') || '';
    } else if (process.env.DATABASE_URL) {
      source = 'env';
    }
    
    // Mask the password in the URL for display
    let maskedUrl = '';
    if (currentDbUrl) {
      try {
        const url = new URL(currentDbUrl);
        if (url.password) {
          url.password = '********';
        }
        maskedUrl = url.toString();
      } catch {
        // If URL parsing fails, just mask everything after the @ if present
        const atIndex = currentDbUrl.indexOf('@');
        if (atIndex > 0) {
          const colonIndex = currentDbUrl.lastIndexOf(':', atIndex);
          if (colonIndex > 0) {
            maskedUrl = currentDbUrl.substring(0, colonIndex + 1) + '********' + currentDbUrl.substring(atIndex);
          } else {
            maskedUrl = '[invalid URL format]';
          }
        } else {
          maskedUrl = '[invalid URL format]';
        }
      }
    }
    
    // Test database connection
    let connectionStatus: 'connected' | 'error' | 'not-configured' = 'not-configured';
    let connectionError = '';
    
    if (currentDbUrl) {
      try {
        const { prisma } = await import('@/lib/db');
        await prisma.$queryRaw`SELECT 1`;
        connectionStatus = 'connected';
      } catch (error) {
        connectionStatus = 'error';
        connectionError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return NextResponse.json({
      hasMasterPassword,
      hasDbUrl,
      source,
      maskedUrl,
      connectionStatus,
      connectionError,
    });
  } catch (error) {
    console.error('Database config GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get database configuration' },
      { status: 500 }
    );
  }
}

// POST: Save database configuration to secrets
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 });
    }
    
    // Check master password is set
    if (!process.env.SECRETS_MASTER_PASSWORD) {
      return NextResponse.json(
        { error: 'SECRETS_MASTER_PASSWORD must be set in environment to store secrets' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { databaseUrl } = body;
    
    if (!databaseUrl) {
      return NextResponse.json({ error: 'databaseUrl is required' }, { status: 400 });
    }
    
    // Validate URL format
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      return NextResponse.json(
        { error: 'Database URL must start with postgresql:// or postgres://' },
        { status: 400 }
      );
    }
    
    // Store in encrypted secrets
    setSecret('DATABASE_URL', databaseUrl);
    
    // Load into current process.env
    loadSecretsToEnv();
    
    // Test the connection
    let testResult: 'success' | 'error' = 'error';
    let testError = '';
    
    try {
      // Force Prisma to reconnect with new URL
      const { PrismaClient } = await import('@prisma/client');
      const testClient = new PrismaClient({
        datasources: {
          db: { url: databaseUrl },
        },
      });
      await testClient.$queryRaw`SELECT 1`;
      await testClient.$disconnect();
      testResult = 'success';
    } catch (error) {
      testError = error instanceof Error ? error.message : 'Connection test failed';
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database URL stored in encrypted secrets',
      testResult,
      testError,
      note: 'Restart the application for the new DATABASE_URL to take full effect',
    });
  } catch (error) {
    console.error('Database config POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save database configuration' },
      { status: 500 }
    );
  }
}

// DELETE: Remove database URL from secrets (falls back to .env)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 });
    }
    
    const { deleteSecret } = await import('@/lib/secrets');
    const deleted = deleteSecret('DATABASE_URL');
    
    return NextResponse.json({
      success: true,
      deleted,
      message: deleted 
        ? 'DATABASE_URL removed from secrets - will fall back to .env value' 
        : 'DATABASE_URL was not in secrets',
    });
  } catch (error) {
    console.error('Database config DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete database configuration' },
      { status: 500 }
    );
  }
}
