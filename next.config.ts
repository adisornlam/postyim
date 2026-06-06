import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source:
          "/reviews/lepro-led-desk-lamp-for-home-office-9-5w-metal-touch-control-5-color-modes-b08lmtq7zf-review",
        destination: "/reviews/best-led-desk-lamp-for-home-office-lepro-review",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
