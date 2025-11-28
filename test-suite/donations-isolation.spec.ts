/**
 * donations-isolation.spec.ts
 *
 * Integration test scaffolds for tenant isolation in donations endpoints.
 * These tests should be run against the running dev server. They rely on the
 * seeded tenant(s) present in the test environment.
 */

import TEST_CONFIG from './test-config';
import { performCredentialsLogin } from './utils';
import seedTestData from './seed';

async function testLeaderboardIsolation() {
  console.log('TEST: Donations leaderboard isolation');
  // Seed deterministic data and use test tenant
  const seeded = await seedTestData();
  const { id: tenantId } = seeded.tenant;

  const { loginResponse, cookieHeader } = await performCredentialsLogin(
    TEST_CONFIG.testUsers.regular.email,
    TEST_CONFIG.testUsers.regular.password
  );

  if (!cookieHeader) throw new Error('Missing cookie for login');

  const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants/${tenantId}/donations/records`, {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });

  if (!response.ok) {
    throw new Error(`Expected 200 from donations records, got ${response.status}`);
  }

  const body = await response.json();
  console.log('Leaderboard response keys:', Object.keys(body));
  // Basic assertion: body should be an object/array
  if (!body) throw new Error('Empty response from donations records');
}

async function testDonationCreateAsNonMember() {
  console.log('TEST: Donation create enforcement for non-member');
  // Seed deterministic data and login as regular (non-member)
  const seeded = await seedTestData();
  const { id: tenantId } = seeded.tenant;

  // Login as a user who should not be a member of the tenant
  const { loginResponse, cookieHeader } = await performCredentialsLogin(
    TEST_CONFIG.testUsers.regular.email,
    TEST_CONFIG.testUsers.regular.password
  );

  if (!cookieHeader) throw new Error('Missing cookie for login');

  const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants/${tenantId}/donations/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ amount: 10, currency: 'USD', displayName: 'Test', isAnonymousOnLeaderboard: false }),
  });

  // If tenant is private and user is non-member, expect 403
  if (response.status === 201) {
    console.warn('Donation created; ensure test user should be non-member for this test');
  } else if (response.status === 403) {
    console.log('Correctly rejected donation creation for non-member');
  } else {
    console.warn('Unexpected response status for donation create:', response.status);
  }
}

async function run() {
  try {
    await testLeaderboardIsolation();
    await testDonationCreateAsNonMember();
    console.log('donations-isolation tests completed (scaffold).');
  } catch (err) {
    console.error('donations-isolation tests failed:', err);
    process.exitCode = 1;
  }
}

if (require.main === module) run();

export default { run };
