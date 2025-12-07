import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getSecretMetadataList,
  setSecret,
  deleteSecret,
  verifyMasterPassword,
  generateSecureSecret,
  getSecret,
  changeMasterPassword,
  exportSecretsForProduction,
} from '@/lib/secrets';

/**
 * GET /api/admin/secrets
 * Returns metadata about all defined secrets (not the values)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const secrets = getSecretMetadataList();
    return NextResponse.json({ secrets });
  } catch (error) {
    console.error('Failed to get secrets metadata:', error);
    return NextResponse.json({ error: 'Failed to get secrets' }, { status: 500 });
  }
}

/**
 * POST /api/admin/secrets
 * Sets a secret value
 * Body: { key: string, value: string, masterPassword: string }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { key, value, masterPassword } = body;
    
    if (!key || !masterPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify master password first
    if (!verifyMasterPassword(masterPassword)) {
      return NextResponse.json({ error: 'Invalid master password' }, { status: 401 });
    }
    
    if (value) {
      setSecret(key, value, masterPassword);
      return NextResponse.json({ success: true, message: `Secret ${key} saved` });
    } else {
      // Empty value means delete
      deleteSecret(key);
      return NextResponse.json({ success: true, message: `Secret ${key} deleted` });
    }
  } catch (error) {
    console.error('Failed to save secret:', error);
    return NextResponse.json({ error: 'Failed to save secret' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/secrets
 * Special operations: verify, generate, change-password, export
 * Body: { action: string, ... }
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'verify': {
        const { masterPassword } = body;
        if (!masterPassword) {
          return NextResponse.json({ error: 'Master password required' }, { status: 400 });
        }
        const valid = verifyMasterPassword(masterPassword);
        return NextResponse.json({ valid });
      }
      
      case 'generate': {
        const { length = 64 } = body;
        const secret = generateSecureSecret(length);
        return NextResponse.json({ secret });
      }
      
      case 'change-password': {
        const { currentPassword, newPassword } = body;
        if (!currentPassword || !newPassword) {
          return NextResponse.json({ error: 'Both passwords required' }, { status: 400 });
        }
        const success = changeMasterPassword(currentPassword, newPassword);
        if (!success) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
        }
        return NextResponse.json({ success: true, message: 'Master password changed' });
      }
      
      case 'export': {
        const { masterPassword } = body;
        if (!masterPassword) {
          return NextResponse.json({ error: 'Master password required' }, { status: 400 });
        }
        if (!verifyMasterPassword(masterPassword)) {
          return NextResponse.json({ error: 'Invalid master password' }, { status: 401 });
        }
        const exportData = exportSecretsForProduction(masterPassword);
        return NextResponse.json({ exportData });
      }
      
      case 'get-value': {
        const { key, masterPassword } = body;
        if (!key || !masterPassword) {
          return NextResponse.json({ error: 'Key and master password required' }, { status: 400 });
        }
        if (!verifyMasterPassword(masterPassword)) {
          return NextResponse.json({ error: 'Invalid master password' }, { status: 401 });
        }
        const value = getSecret(key, masterPassword);
        return NextResponse.json({ value });
      }
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Secrets operation failed:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/secrets
 * Deletes a secret
 * Body: { key: string }
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { key } = body;
    
    if (!key) {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }
    
    const deleted = deleteSecret(key);
    
    if (deleted) {
      return NextResponse.json({ success: true, message: `Secret ${key} deleted` });
    } else {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to delete secret:', error);
    return NextResponse.json({ error: 'Failed to delete secret' }, { status: 500 });
  }
}
