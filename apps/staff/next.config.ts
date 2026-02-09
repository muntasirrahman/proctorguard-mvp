import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@proctorguard/auth', '@proctorguard/database', '@proctorguard/permissions', '@proctorguard/ui'],
};

export default nextConfig;
