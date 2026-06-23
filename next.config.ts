import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.slack-edge.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
    ],
  },
};

export default nextConfig;