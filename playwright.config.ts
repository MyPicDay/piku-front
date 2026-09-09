import { defineConfig } from '@playwright/test';

const shouldStartWebServer = process.env.PLAYWRIGHT_NO_WEBSERVER !== '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: shouldStartWebServer
    ? {
        command:
          'NEXT_PUBLIC_E2E_TEST=1 NEXT_PUBLIC_BASE_URL=http://localhost:3000 PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers npm run dev -- --hostname localhost --port 3000',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
