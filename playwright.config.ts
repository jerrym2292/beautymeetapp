import { defineConfig } from '@playwright/test';

import type { PlaywrightTestConfig } from '@playwright/test';

// Default to local dev for stability.
// Override when you explicitly want to test production:
//   BASE_URL=https://beautymeetapp.com npx playwright test
const baseURL = process.env.BASE_URL || 'http://localhost:3001';

const config: PlaywrightTestConfig = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: './tests/global-setup.ts',
  // Auto-start the dev server for local E2E runs.
  // If you're already running it, set PW_WEB_SERVER=0 to skip.
  webServer: process.env.PW_WEB_SERVER === '0' ? undefined : {
    command: 'PORT=3001 npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});

export default config;
