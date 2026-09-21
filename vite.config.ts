import { resolve, dirname } from "node:path";
import { sites } from "@openai/sites-vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig(async () => {
  process.env.CLOUDFLARE_CF_FETCH_ENABLED = "false";
  process.env.WRANGLER_SEND_METRICS = "false";
  process.env.WRANGLER_WRITE_LOGS = "false";
  process.env.WRANGLER_LOG_PATH = ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH = ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH = ".wrangler/registry";
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  const overrides = new Map(["db", "config", "avatar", "file-storage"].map(name => [resolve("lib", name), resolve("hosting", `${name}.ts`)]));
  return {
    plugins: [
      {
        name: "condo-hosted-adapters", enforce: "pre",
        resolveId(source: string, importer?: string) {
          const file = source.startsWith("@/") ? resolve(source.slice(2)) : source.startsWith(".") && importer ? resolve(dirname(importer), source) : source;
          return overrides.get(file.replace(/\.ts$/, ""));
        },
      },
      vinext(), sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] }, inspectorPort: false,
        config: {
          main: "hosting/worker.ts",
          compatibility_date: "2026-05-15",
          compatibility_flags: ["nodejs_compat"],
          d1_databases: [{ binding: "DB", database_name: "site-creator-d1", database_id: "00000000-0000-4000-8000-000000000000", migrations_dir: "drizzle" }],
          r2_buckets: [{ binding: "BUCKET", bucket_name: "site-creator-r2" }],
        },
      }),
    ],
  };
});
