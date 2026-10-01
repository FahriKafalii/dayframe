import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dayframe/types"],
  // Hide the bottom-left dev overlay; it overlapped the sidebar footer/KPI
  // cards during local use and design screenshots. No effect in production.
  devIndicators: false,
};

export default nextConfig;
