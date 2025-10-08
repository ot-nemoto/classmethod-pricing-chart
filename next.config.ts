import type { NextConfig } from "next";

const isStatic = process.env.BUILD_MODE === "static";

const nextConfig: NextConfig = {
  ...(isStatic && {
    output: "export",
    trailingSlash: true,
    basePath: "/classmethod-pricing-chart",
    assetPrefix: "/classmethod-pricing-chart",
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
