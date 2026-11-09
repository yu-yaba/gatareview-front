import { defineConfig, devices } from '@playwright/test'

// Parallel local runs can move the isolated server off the default port.
const port = Number(process.env.PLAYWRIGHT_PWA_PORT || 39597)
const origin = `http://127.0.0.1:${port}`

// npm run buildで生成した実SWを、個人情報を含まない隔離サーバーで検証する。
export default defineConfig({
  testDir: './tests/security',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: origin, serviceWorkers: 'allow', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node tests/security/pwa-server.mjs',
    url: origin,
    reuseExistingServer: false,
    env: { PLAYWRIGHT_PWA_PORT: String(port) },
  },
})
