import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Suprimir warning de cross-origin en desarrollo local
  experimental: {
    allowedDevOrigins: ['127.0.0.1', 'localhost'],
  },
}

export default nextConfig
