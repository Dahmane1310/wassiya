import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/backend"],
  // Emit a self-contained server (.next/standalone) for a minimal Docker image.
  output: "standalone",
  // Trace from the monorepo root so workspace deps in ../../node_modules are bundled.
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
}

export default nextConfig
