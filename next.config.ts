import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', 'libsql', '@payloadcms/db-sqlite'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

export default withPayload(nextConfig)
