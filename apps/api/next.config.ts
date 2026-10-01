import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep sequelize external (it relies on dynamic requires that can't be
  // bundled). pg / pg-hstore are intentionally NOT external so Next bundles
  // the Postgres driver into the serverless function; in this pnpm monorepo
  // they are only symlinked into apps/api, and leaving them external made the
  // function ship without pg ("Please install pg package manually") on Vercel.
  serverExternalPackages: ["sequelize"],
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
