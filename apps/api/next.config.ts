import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kept external so Next doesn't bundle their dynamic internals; pg ships via
  // a static import + dialectModule in packages/db.
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
