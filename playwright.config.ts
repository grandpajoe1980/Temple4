import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Temple Platform UI Tests
 */
export default defineConfig({
  testDir: './test-suite/ui-tests',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid conflicts
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
