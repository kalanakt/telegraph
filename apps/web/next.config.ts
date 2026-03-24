import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.(md|mdx)$/
});

const nextConfig: NextConfig = {
  typedRoutes: false,
  pageExtensions: ["ts", "tsx", "md", "mdx"]
};

export default withMDX(nextConfig);
