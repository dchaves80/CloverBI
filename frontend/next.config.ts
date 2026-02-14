import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Habilitar Turbopack para dev
  experimental: {
    // turbo: {}, // Ya viene por default con --turbopack
  },
}

export default nextConfig
