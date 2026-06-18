import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(appRoot, "..", "..");
const packageAliases = {
  "@agent-chat/chat-core": join(workspaceRoot, "packages/chat-core/src/index.ts"),
  "@agent-chat/types": join(workspaceRoot, "packages/types/src/index.ts"),
  "@agent-chat/ui-web": join(workspaceRoot, "packages/ui-web/src/index.ts"),
  "@agent-chat/utils": join(workspaceRoot, "packages/utils/src/index.ts")
};
const turbopackPackageAliases = {
  "@agent-chat/chat-core": "./packages/chat-core/src/index.ts",
  "@agent-chat/types": "./packages/types/src/index.ts",
  "@agent-chat/ui-web": "./packages/ui-web/src/index.ts",
  "@agent-chat/utils": "./packages/utils/src/index.ts"
};

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  transpilePackages: [
    "@agent-chat/chat-core",
    "@agent-chat/types",
    "@agent-chat/ui-web",
    "@agent-chat/utils"
  ],
  turbopack: {
    root: workspaceRoot,
    resolveAlias: turbopackPackageAliases
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...packageAliases
    };

    return config;
  },
  experimental: {
    optimizePackageImports: ["@lobehub/ui", "@lobehub/ui/chat", "antd", "lucide-react"]
  }
};

export default nextConfig;
