import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Suprimir warning de cross-origin en desarrollo local
  allowedDevOrigins: ['127.0.0.1:3000', 'localhost:3000'],
}

export default nextConfig
