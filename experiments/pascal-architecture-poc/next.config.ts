import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@pascal-app/editor'],
  typescript: {
    // Pascal editor beta currently publishes its TypeScript source and has
    // upstream tuple-type errors under a consumer tsc. BASOUL host code is
    // checked separately with tsconfig.host.json; this only prevents upstream
    // beta source errors from blocking the isolated bundling experiment.
    ignoreBuildErrors: true,
  },
}

export default nextConfig
