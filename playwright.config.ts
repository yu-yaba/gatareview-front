import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080";
const shouldStartLocalServer = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(baseURL);
const localServerPort = shouldStartLocalServer ? new URL(baseURL).port || "80" : "8080";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
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
        webServer: {
          command: `npx next dev -H 127.0.0.1 -p ${localServerPort}`,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            ...process.env,
            NEXT_PUBLIC_ENV: "http://127.0.0.1:3001",
            NEXTAUTH_URL: `http://127.0.0.1:${localServerPort}`,
            NEXTAUTH_SECRET: "playwright-nextauth-secret",
            GOOGLE_CLIENT_ID: "playwright-google-client-id",
            GOOGLE_CLIENT_SECRET: "playwright-google-client-secret",
            NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "playwright-recaptcha-site-key",
            NEXT_PUBLIC_GA_ID: "",
            DOCKER_BACKEND_URL: "http://127.0.0.1:3001",
          },
        },
      }
    : {}),
});
