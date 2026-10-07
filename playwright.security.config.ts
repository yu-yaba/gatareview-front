import { defineConfig, devices } from '@playwright/test'

// npm run buildで生成した実SWを、個人情報を含まない隔離サーバーで検証する。
export default defineConfig({
  testDir: './tests/security',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:39597', serviceWorkers: 'allow', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node tests/security/pwa-server.mjs',
    url: 'http://127.0.0.1:39597',
    reuseExistingServer: false,
  },
})
