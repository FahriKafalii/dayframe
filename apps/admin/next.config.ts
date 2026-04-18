import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dayframe/types"],
};

export default nextConfig;
