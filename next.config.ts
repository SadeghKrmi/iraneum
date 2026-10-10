import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: every page is pre-rendered into `out/`.
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
