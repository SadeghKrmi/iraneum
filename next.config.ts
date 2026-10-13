import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: every page is pre-rendered into `out/`.
  output: "export",
  trailingSlash: true,
  // Set when publishing under a sub-path (GitHub Pages: "/iraneum"); see lib/basePath.ts.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default nextConfig;
