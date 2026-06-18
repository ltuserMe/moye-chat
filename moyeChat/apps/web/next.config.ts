import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(appRoot, "..", "..");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  turbopack: {
    root: workspaceRoot
  },
  experimental: {
    optimizePackageImports: ["@lobehub/ui", "@lobehub/ui/chat", "antd", "lucide-react"]
  }
};

export default nextConfig;
