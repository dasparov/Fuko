import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Orders carry a base64 payment screenshot; the default 1MB Server Action body
  // limit rejects larger (esp. iOS) images, which previously hung "I've Paid".
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Enable image caching for better performance
    minimumCacheTTL: 31536000, // 1 year in seconds
    formats: ['image/webp', 'image/avif'],
  },
  // Add cache headers for static assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
