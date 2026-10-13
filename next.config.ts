import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Staging is reverse-proxied on this host; next dev blocks /_next chunks without it.
  allowedDevOrigins: ["chat.getkolink.com", "api.chat.getkolink.com", "kolinkchat-dev.kolink.tech", "43.198.13.165"],
};

export default nextConfig;
