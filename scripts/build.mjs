import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
const hosted = process.env.CONDO_HOSTED_BUILD === "1" || process.argv.includes("--sites");
if (hosted) process.env.CONDO_HOSTED_BUILD = "1";
const result = spawnSync(process.execPath, [hosted ? "node_modules/vinext/dist/cli.js" : "node_modules/next/dist/bin/next", "build"], { stdio: "inherit", env: process.env });
if (hosted && result.status === 0) {
  // These are generated Node output and local Worker-test state, never deployable assets.
  rmSync("dist/standalone", { recursive: true, force: true });
  rmSync("dist/server/.wrangler", { recursive: true, force: true });
}
process.exit(result.status ?? 1);
