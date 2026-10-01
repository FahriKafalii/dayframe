import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests for the Dayframe web app. Assumes the dev stack is already running
 * (web on :1453, api on :8000, postgres via docker). Run with `pnpm test:e2e`.
 *
 * BASE_URL can be overridden via env; defaults to the local dev port 1453.
 */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:1453";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
