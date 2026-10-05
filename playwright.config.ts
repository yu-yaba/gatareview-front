import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080";
const shouldStartLocalServer = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(baseURL);
const localServerPort = shouldStartLocalServer ? new URL(baseURL).port || "80" : "8080";
const mockApiURL = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  // The server-rendered pages share a configurable mock API; isolate scenarios.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  ...(shouldStartLocalServer
    ? {
        webServer: [
          {
            command: "node tests/e2e/mock-backend.mjs",
            url: `${mockApiURL}/health`,
            reuseExistingServer: false,
            stdout: "pipe" as const,
            stderr: "pipe" as const,
          },
          {
            command: `npx next dev -H 127.0.0.1 -p ${localServerPort}`,
            url: baseURL,
            reuseExistingServer: false,
            stdout: "pipe",
            stderr: "pipe",
            env: {
              ...process.env,
              NEXT_PUBLIC_ENV: mockApiURL,
              NEXTAUTH_URL: `http://127.0.0.1:${localServerPort}`,
              NEXTAUTH_SECRET: "playwright-nextauth-secret",
              GOOGLE_CLIENT_ID: "playwright-google-client-id",
              GOOGLE_CLIENT_SECRET: "playwright-google-client-secret",
              NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "playwright-recaptcha-site-key",
              NEXT_PUBLIC_GA_ID: "",
              DOCKER_BACKEND_URL: mockApiURL,
            },
          },
        ],
      }
    : {}),
});
