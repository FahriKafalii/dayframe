import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sequelize loads its dialect (pg) via a dynamic require that a bundler can't
  // follow, so these must stay external and be present in node_modules at
  // runtime. See vercel.json's installCommand, which installs the whole pnpm
  // workspace so the hoisted pg driver ships with the function.
  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
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
