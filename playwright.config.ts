import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const e2eDataDir = path.join(process.cwd(), "data", "e2e");
const e2eAuthSecret = "kondo-ninja-e2e-secret-that-is-long-enough";
const e2eBaseUrl = "http://127.0.0.1:3100";

process.env.DATA_DIR = e2eDataDir;
process.env.AUTH_SECRET = e2eAuthSecret;
process.env.APP_URL = e2eBaseUrl;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.APP_URL,
    launchOptions: { executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox", "--disable-dev-shm-usage"] },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: "pnpm dev --hostname 127.0.0.1 --port 3100",
    url: e2eBaseUrl,
    env: {
      DATA_DIR: e2eDataDir,
      AUTH_SECRET: e2eAuthSecret,
      APP_URL: e2eBaseUrl,
      KONDO_E2E: "1",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
