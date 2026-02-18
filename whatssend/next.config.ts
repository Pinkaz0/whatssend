import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['xlsx', 'libphonenumber-js'],
}

export default nextConfig