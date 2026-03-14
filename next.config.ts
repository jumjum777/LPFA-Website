import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['ws', 'bufferutil', 'utf-8-validate'],
  async rewrites() {
    return [
      {
        source: '/documents/:path*',
        destination:
          'https://nwweqdsxcqrorkdvuoot.supabase.co/storage/v1/object/public/new-images/documents/:path*',
      },
    ];
  },
};

export default nextConfig;
