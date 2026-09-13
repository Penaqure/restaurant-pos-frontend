import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundles only the files the server actually needs into .next/standalone,
  // so the production Docker image doesn't have to ship full node_modules.
  output: "standalone",
};

export default nextConfig;
