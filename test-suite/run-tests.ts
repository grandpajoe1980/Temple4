/**
 * Main Test Runner
 * Orchestrates all test suites and generates comprehensive reports
 */

import { TestLogger } from './test-logger';
import { APITestSuite } from './api-tests';
import { PageTestSuite } from './page-tests';
import { FeatureTestSuite } from './feature-tests';
import TEST_CONFIG from './test-config';

async function checkServerAvailability(): Promise<boolean> {
  try {
    console.log('Checking if server is running...');
    const response = await fetch(TEST_CONFIG.baseUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    console.log(`✓ Server is running at ${TEST_CONFIG.baseUrl}`);
    return true;
  } catch (error) {
    console.error(`✗ Server is not available at ${TEST_CONFIG.baseUrl}`);
    console.error('Please start the development server with: npm run dev');
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('TEMPLE PLATFORM - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log('='.repeat(80));

  // Check if server is running
  const serverAvailable = await checkServerAvailability();
  if (!serverAvailable) {
    console.log('\n⚠ Cannot proceed with tests - server is not available');
    process.exit(1);
  }

  // Initialize logger
  const logger = new TestLogger('./test-results');

  // Fetch Springfield Church tenant for testing
  let springfieldTenant: any = null;
  let springfieldTenantId: string | null = null;
  let homerUserId: string | null = null;

  try {
    console.log('\nFetching Springfield Church tenant...');
    const tenantsResponse = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants`);
    if (tenantsResponse.ok) {
      const data = await tenantsResponse.json();
      const tenants = data.tenants || [];
      springfieldTenant = tenants.find((t: any) => t.slug === TEST_CONFIG.testTenant.slug);
      
      if (springfieldTenant) {
        springfieldTenantId = springfieldTenant.id;
        console.log(`✓ Found Springfield Church tenant: ${springfieldTenantId}`);
        
        // Login as Ned to get Homer's user ID from members
        try {
          const loginBody = new URLSearchParams({
            email: TEST_CONFIG.testUsers.admin.email,
            password: TEST_CONFIG.testUsers.admin.password,
            callbackUrl: TEST_CONFIG.apiBaseUrl,
          });

          const loginResponse = await fetch(`${TEST_CONFIG.apiBaseUrl}/auth/callback/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: loginBody.toString(),
            redirect: 'manual',
          });

          const cookies = loginResponse.headers.get('set-cookie');
          if (cookies) {
            const membersResponse = await fetch(`${TEST_CONFIG.apiBaseUrl}/tenants/${springfieldTenantId}/members`, {
              headers: { Cookie: cookies },
            });
            
            if (membersResponse.ok) {
              const membersData = await membersResponse.json();
              const members = membersData.members || [];
              const homer = members.find((m: any) => 
                m.user?.profile?.email === TEST_CONFIG.testUsers.regular.email ||
                m.user?.profile?.displayName?.includes('Homer')
              );
              if (homer?.user?.id) {
                homerUserId = homer.user.id;
                console.log(`✓ Found Homer Simpson user ID: ${homerUserId}`);
              }
            }
          }
        } catch (err) {
          console.log('⚠ Could not fetch members:', err);
        }
      } else {
        console.log('⚠ Springfield Church tenant not found, some tests will be skipped');
      }
    }
  } catch (error) {
    console.log('⚠ Could not fetch tenant data:', error);
  }

  // Initialize test suites with tenant info
  const apiTests = new APITestSuite(logger);
  const featureTests = new FeatureTestSuite(logger);
  const pageTests = new PageTestSuite(logger);

  // Set the test tenant ID if we found it
  if (springfieldTenantId) {
    (apiTests as any).testTenantId = springfieldTenantId;
    (featureTests as any).testTenantId = springfieldTenantId;
  }

  const startTime = Date.now();

  try {
    // Run feature tests first
    await featureTests.runAllTests();

    // Get test IDs for page tests (use Springfield tenant if available)
    const testTenantId = springfieldTenantId || featureTests.getTestTenantId();
    const testUserId = homerUserId || featureTests.getTestUserId();
    
    if (testTenantId) {
      console.log(`\n✓ Using tenant ID for page tests: ${testTenantId}`);
    }
    if (testUserId) {
      console.log(`✓ Using user ID for page tests: ${testUserId}`);
    }
    
    pageTests.setTestIds(testTenantId, testUserId);

    // Run API tests
    await apiTests.runAllTests();

    // Run page tests
    await pageTests.runAllTests();

    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;

    console.log('\n' + '='.repeat(80));
    console.log('ALL TESTS COMPLETED');
    console.log('='.repeat(80));
    console.log(`Total Duration: ${totalDuration.toFixed(2)}s`);

    // Print summary
    logger.printSummary();

    // Save results to files
    logger.saveResults();

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS:');
    console.log('='.repeat(80));
    console.log('1. Review the test report in: test-results/test-report-*.txt');
    console.log('2. Check detailed issues in: test-results/test-issues-*.json');
    console.log('3. Fix the failing tests systematically');
    console.log('4. Re-run the tests to verify fixes');
    console.log('='.repeat(80) + '\n');

    // Exit with error code if there were failures
    const summary = logger.getSummary();
    if (summary.failed > 0 || summary.errors > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('FATAL ERROR IN TEST SUITE');
    console.error('='.repeat(80));
    console.error(error);
    logger.saveResults();
    process.exit(1);
  }
}

// Run the test suite
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
