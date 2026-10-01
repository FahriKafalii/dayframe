import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // sequelize loads its dialect (pg) via a dynamic require that Next's tracer
  // can't follow, so pg never ships with the serverless function on Vercel
  // ("Please install pg package manually"). Keep these external AND explicitly
  // trace the pg package (only pg itself — a wide glob bloated the function and
  // failed to deploy) so the driver is present at runtime. Root is the monorepo
  // so the hoisted .pnpm path resolves.
  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/api/**/*": ["../../node_modules/.pnpm/pg@*/node_modules/pg/**/*"],
  },
  transpilePackages: [
    "@dayframe/db",
    "@dayframe/lib",
    "@dayframe/models",
    "@dayframe/repositories",
    "@dayframe/services",
    "@dayframe/types",
  ],
};

export default nextConfig;
