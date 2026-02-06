import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  experimental: {
    // serverActions: true, // Enabled by default in Next.js 15
  },
};

export default withPWA(nextConfig);
