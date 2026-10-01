import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
  transpilePackages: [
    "@dayframe/db",
    "@dayframe/lib",
    "@dayframe/models",
    "@dayframe/repositories",
    "@dayframe/services",
    "@dayframe/types",
  ],
  // In this pnpm monorepo `pg` is hoisted to the repo root and only symlinked
  // into apps/api. Point output file tracing at the monorepo root and force the
  // native Postgres driver (and its transitive deps) into the serverless
  // function so Sequelize can require("pg") at runtime on Vercel. Without this
  // the function ships without pg and fails with "Please install pg manually".
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/api/**/*": [
      "../../node_modules/.pnpm/pg@*/**",
      "../../node_modules/.pnpm/pg-pool@*/**",
      "../../node_modules/.pnpm/pg-protocol@*/**",
      "../../node_modules/.pnpm/pg-types@*/**",
      "../../node_modules/.pnpm/pg-connection-string@*/**",
      "../../node_modules/.pnpm/pgpass@*/**",
      "../../node_modules/.pnpm/pg-hstore@*/**",
      "../../node_modules/.pnpm/pg-cloudflare@*/**",
    ],
  },
};

export default nextConfig;
