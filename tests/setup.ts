import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll } from "vitest";

const testDataDir = path.join(process.cwd(), "data", "test");
process.env.DATA_DIR = testDataDir;
process.env.AUTH_SECRET = "kondo-ninja-test-secret-that-is-long-enough";
process.env.MAX_UPLOAD_BYTES = "1024";
process.env.MAX_UPLOAD_BATCH_BYTES = "4096";

rmSync(testDataDir, { recursive: true, force: true });
mkdirSync(testDataDir, { recursive: true, mode: 0o700 });

const { closeDbForTests } = await import("../lib/db.ts");

afterAll(() => {
  closeDbForTests();
  rmSync(testDataDir, { recursive: true, force: true });
});
