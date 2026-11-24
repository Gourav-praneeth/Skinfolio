import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth + Prisma need request-time rendering for MVP routes.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
