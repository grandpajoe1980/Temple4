import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { joinTrip, getMembershipForUserInTenant } from '@/lib/data';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const intakeSchema = z.object({
  // top-level flag required to enforce consent
  waiverAccepted: z.boolean(),
  personalInfo: z
    .object({
      fullLegalName: z.string().optional(),
      preferredName: z.string().optional(),
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      guardianPhone: z.string().optional(),
      email: z.string().email().optional(),
      emergencyContact: z
        .object({
          name: z.string().optional(),
          relationship: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
        })
        .optional(),
    })
    .optional(),
  medical: z
    .object({
      allergies: z.string().optional(),
      conditions: z.string().optional(),
      medications: z.string().optional(),
      dietaryRestrictions: z.string().optional(),
      accessibilityNeeds: z.string().optional(),
      physicianName: z.string().optional(),
      physicianPhone: z.string().optional(),
      insuranceProvider: z.string().optional(),
      insurancePolicyNumber: z.string().optional(),
      consentFirstAid: z.boolean().optional(),
      consentEmergencyCare: z.boolean().optional(),
    })
    .optional(),
  passport: z
    .object({
      passportNumber: z.string().optional(),
      passportExpiration: z.string().optional(),
      passportCountry: z.string().optional(),
      passportCopyUrl: z.string().url().optional(),
    })
    .optional(),
  guardian: z
    .object({
      guardianName: z.string().optional(),
      guardianContact: z.string().optional(),
      permissionTravel: z.boolean().optional(),
      permissionWithLeader: z.boolean().optional(),
      guardianSignature: z.string().optional(),
      guardianSignatureDate: z.string().optional(),
    })
    .optional(),
  waiver: z
    .object({
      tripName: z.string().optional(),
      tripDates: z.string().optional(),
      participantName: z.string().optional(),
    })
    .optional(),
  agreements: z
    .object({
      conduct: z.boolean().optional(),
      followInstructions: z.boolean().optional(),
      substanceFree: z.boolean().optional(),
      curfew: z.boolean().optional(),
      expectations: z.boolean().optional(),
      mediaReleaseOptOutInitials: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; tripId: string }> }) {
  const { tenantId, tripId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  try {
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    if (!membership) return NextResponse.json({ message: 'You must be a tenant member to join a trip' }, { status: 403 });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { settings: true } });
    if (!tenant?.settings?.enableTrips) return NextResponse.json({ message: 'Trips feature disabled' }, { status: 403 });

    const rawBody = await request.json().catch(() => ({}));
    const parsed = intakeSchema.safeParse(rawBody);
    if (!parsed.success || !parsed.data.waiverAccepted) {
      return NextResponse.json(
        { message: 'Please complete the required join form and accept the waiver before joining.' },
        { status: 400 }
      );
    }

    const result = await joinTrip(tenantId, tripId, userId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Failed to join trip ${tripId}:`, error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to join trip' }, { status: 500 });
  }
}
