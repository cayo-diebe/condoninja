import { env } from "cloudflare:workers";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
export const bindings = env as unknown as { DB: D1Database; BUCKET: R2Bucket; AUTH_SECRET: string; APP_URL?: string };
