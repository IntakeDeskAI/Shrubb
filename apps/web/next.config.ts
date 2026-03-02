import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@landscape-ai/shared'],
  async redirects() {
    return [
      { source: '/app/inbox', destination: '/app/leads', permanent: true },
      { source: '/app/inbox/:id', destination: '/app/leads/:id', permanent: true },
    ];
  },
};

export default nextConfig;
