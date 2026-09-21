import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.KONDO_E2E === "1" ? ".next-e2e" : ".next",
  experimental: {
    useTypeScriptCli: false,
  },
  output: process.env.CONDO_HOSTED_BUILD === "1" ? undefined : "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["busboy"],
};

export default nextConfig;
