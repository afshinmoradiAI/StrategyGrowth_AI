import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker standalone build (copies only what's needed, no node_modules)
  output: "standalone",
};

export default nextConfig;
