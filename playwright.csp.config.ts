import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080'
const port = new URL(baseURL).port || '8080'

// Build with the same public API origin and run the existing mock API first.
export default defineConfig({
  testDir: './tests/csp',
  workers: 1,
  use: { baseURL, serviceWorkers: 'allow', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next start -H 127.0.0.1 -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
  },
})
