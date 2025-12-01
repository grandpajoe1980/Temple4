/**
 * messaging-isolation.spec.ts
 *
 * Integration test scaffolds for tenant isolation in messaging.
 * These tests are intended to be run against the running dev server used by `npm run test:suite`.
 * They use existing test helpers in `test-suite/utils.ts` and `test-suite/test-config.ts`.
 *
 * NOTE: This is a scaffold with runnable examples. Adjust seed IDs and expectations to your environment.
 */

import TEST_CONFIG from './test-config';
import { performCredentialsLogin, normalizeSetCookieHeader } from './utils';
import seedTestData from './seed';

async function testConversationListing() {
  console.log('TEST: Conversation listing isolation');
  // Seed deterministic data
  const seeded = await seedTestData();

  // Login as regular test user
  const { loginResponse, cookieHeader } = await performCredentialsLogin(
    TEST_CONFIG.testUsers.regular.email,
    TEST_CONFIG.testUsers.regular.password
  );

  if (!cookieHeader) {
    throw new Error('Failed to obtain auth cookie for regular user');
  }

  const res = await fetch(`${TEST_CONFIG.apiBaseUrl}/conversations`, {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });

  if (!res.ok) {
    throw new Error(`Expected 200 from /api/conversations, got ${res.status}`);
  }

  const convos = await res.json();
  console.log('Conversations returned:', convos.length);

  // Assert: regular user should NOT see tenant channel from which they're not a member
  const tenantChannelId = seeded.conversations.tenantChannelId;
  const hasTenantChannel = convos.some((c: any) => c.id === tenantChannelId);
  if (hasTenantChannel) throw new Error('Regular user should not see tenant-only channel they do not belong to');
}

async function testDirectMessageCreation() {
  console.log('TEST: Direct message creation (DM policy: global allowed)');

  const { loginResponse, cookieHeader } = await performCredentialsLogin(
    TEST_CONFIG.testUsers.regular.email,
    TEST_CONFIG.testUsers.regular.password
  );

  if (!cookieHeader) throw new Error('Missing cookie for login');

  // NOTE: Update recipientId to a valid user from your seeded DB
  // Use seeded regular user as recipient of DM (admin <-> regular already seeded)
  const seeded = await seedTestData();
  const recipientId = seeded.users.regular;

  const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/conversations/direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ recipientId }),
  });

  if (!response.ok) {
    throw new Error(`Expected 200 from POST /conversations/direct, got ${response.status}`);
  }

  const body = await response.json();
  console.log('Direct conversation response:', body.id || body);
}

async function run() {
  try {
    await testConversationListing();
    await testDirectMessageCreation();
    console.log('messaging-isolation tests completed (scaffold).');
  } catch (err) {
    console.error('messaging-isolation tests failed:', err);
    process.exitCode = 1;
  }
}

if (require.main === module) run();

const suite = { run };
export default suite;
