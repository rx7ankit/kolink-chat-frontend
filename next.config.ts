import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Staging is reverse-proxied on this host; next dev blocks /_next chunks without it.
  allowedDevOrigins: ["chat.kolink.tech", "api.kolink.tech", "chat.getkolink.com", "api.chat.getkolink.com", "kolinkchat-dev.kolink.tech", "43.198.13.165"],
  // The EC2 web container runs `next dev`; hide the bottom-left N badge.
  devIndicators: false,
};

export default nextConfig;
