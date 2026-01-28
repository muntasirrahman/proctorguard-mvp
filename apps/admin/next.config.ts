import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@proctorguard/auth',
    '@proctorguard/config',
    '@proctorguard/database',
    '@proctorguard/permissions',
    '@proctorguard/ui',
  ],
  // Enable monorepo file tracing - includes files from parent directories
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
