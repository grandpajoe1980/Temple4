/**
 * trip-donations-isolation.spec.ts
 *
 * Tests membership enforcement for trip donations (tenant-private fundraisers).
 */

import TEST_CONFIG from './test-config';
import { performCredentialsLogin } from './utils';
import seedTestData from './seed';
import { prisma } from '../lib/db';

async function testTripDonationRequiresMembership() {
  console.log('TEST: Trip donation membership enforcement');

  const seeded = await seedTestData();
  const { id: tenantId } = seeded.tenant;

  // Create a trip scoped to the tenant with fundraisingVisibility set to MEMBERS_ONLY
  const trip = await prisma.trip.create({
    data: {
      tenantId,
      name: 'Test Trip Fundraiser',
      description: 'Trip for testing donations',
      fundraisingEnabled: true,
      fundraisingVisibility: 'MEMBERS_ONLY',
    }
  });

  // Login as regular (non-member)
  const { cookieHeader: nonMemberCookie } = await performCredentialsLogin(
    TEST_CONFIG.testUsers.regular.email,
    TEST_CONFIG.testUsers.regular.password
  );

  if (!nonMemberCookie) throw new Error('Missing cookie for non-member login');

  const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants/${tenantId}/trips/${trip.id}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: nonMemberCookie },
    body: JSON.stringify({ amountCents: 1000, currency: 'USD' }),
  });

  if (response.status === 201) {
    throw new Error('Expected non-member to be forbidden from donating to a MEMBERS_ONLY trip');
  }

  if (response.status !== 403) {
    throw new Error(`Unexpected status for non-member trip donation: ${response.status}`);
  }

  console.log('Non-member correctly blocked (403)');

  // Login as admin (approved member)
  const { cookieHeader: adminCookie } = await performCredentialsLogin(
    TEST_CONFIG.testUsers.admin.email,
    TEST_CONFIG.testUsers.admin.password
  );

  if (!adminCookie) throw new Error('Missing cookie for admin login');

  const okResponse = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants/${tenantId}/trips/${trip.id}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ amountCents: 1500, currency: 'USD' }),
  });

  if (okResponse.status !== 201) {
    const text = await okResponse.text();
    throw new Error(`Expected member to donate successfully; got ${okResponse.status}: ${text}`);
  }

  console.log('Member donation succeeded (201)');
}

async function run() {
  try {
    await testTripDonationRequiresMembership();
    console.log('trip-donations-isolation test completed');
  } catch (err) {
    console.error('trip-donations-isolation failed:', err);
    process.exitCode = 1;
  }
}

if (require.main === module) run();

export default { run };
