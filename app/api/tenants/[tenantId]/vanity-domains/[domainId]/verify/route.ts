import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { handleApiError } from '@/lib/api-response';
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

// POST: Trigger DNS verification
export async function POST(
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

    if (domain.status !== 'PENDING_VERIFICATION') {
      return NextResponse.json({ 
        error: 'Domain is not in pending verification status',
        currentStatus: domain.status,
      }, { status: 400 });
    }

    // Update verification attempts
    await prisma.vanityDomain.update({
      where: { id: domainId },
      data: {
        verificationAttempts: domain.verificationAttempts + 1,
        lastVerificationCheck: new Date(),
      },
    });

    // Try to verify DNS
    const txtRecordName = `_temple-verify.${domain.domain}`;
    let verified = false;
    let error: string | null = null;

    try {
      const records = await resolveTxt(txtRecordName);
      // records is an array of arrays of strings
      const flatRecords = records.flat();
      verified = flatRecords.some(record => record === domain.verificationToken);
    } catch (dnsError: unknown) {
      const errorMessage = dnsError instanceof Error ? dnsError.message : 'Unknown error';
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ENODATA')) {
        error = 'DNS record not found. Please ensure the TXT record has been added and DNS has propagated (this can take up to 48 hours).';
      } else {
        error = `DNS lookup failed: ${errorMessage}`;
      }
    }

    if (verified) {
      // Update domain status to DNS_VERIFIED
      const updatedDomain = await prisma.vanityDomain.update({
        where: { id: domainId },
        data: {
          status: 'DNS_VERIFIED',
          verifiedAt: new Date(),
        },
      });

      return NextResponse.json({
        verified: true,
        domain: updatedDomain,
        message: 'DNS verification successful! Your domain is now verified.',
        nextStep: 'SSL certificate provisioning will begin automatically.',
      });
    }

    return NextResponse.json({
      verified: false,
      error: error || 'Verification token not found in DNS records.',
      instructions: {
        type: 'TXT',
        name: txtRecordName,
        value: domain.verificationToken,
        note: 'Please ensure the TXT record is correctly configured. DNS changes can take up to 48 hours to propagate.',
      },
      attempts: domain.verificationAttempts + 1,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
