import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dayframe/types"],
  // Dev overlay overlapped the sidebar footer; hidden. No effect in production.
  devIndicators: false,
};

export default nextConfig;
