import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import type { FullConfig } from "@playwright/test";

export default function globalSetup(_config: FullConfig) {
  void _config;
  const dataDir = path.join(process.cwd(), "data", "e2e");
  rmSync(dataDir, { recursive: true, force: true });
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
}
