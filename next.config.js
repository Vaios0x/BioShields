/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@nestjs/common', '@nestjs/core', '@nestjs/config', '@nestjs/throttler', '@nestjs/schedule'],
  experimental: {
    externalDir: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    dirs: ['app', 'components', 'lib'],
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
  webpack: (config, { isServer }) => {
    // External packages for Reown AppKit compatibility
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    // Handle Solana mobile wallet adapter - make it optional
    config.resolve.alias = {
      ...config.resolve.alias,
      '@solana-mobile/wallet-adapter-mobile': false,
    };

    // Fix for "Illegal invocation" errors with browser APIs
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
      };
    }
    
    return config;
  },
  env: {
    NEXT_PUBLIC_SOLANA_RPC: process.env.NEXT_PUBLIC_SOLANA_RPC,
    NEXT_PUBLIC_BASE_RPC: process.env.NEXT_PUBLIC_BASE_RPC,
    NEXT_PUBLIC_PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID,
    NEXT_PUBLIC_INSURANCE_POOL: process.env.NEXT_PUBLIC_INSURANCE_POOL,
    NEXT_PUBLIC_LIVES_TOKEN: process.env.NEXT_PUBLIC_LIVES_TOKEN,
    NEXT_PUBLIC_SHIELD_TOKEN: process.env.NEXT_PUBLIC_SHIELD_TOKEN,
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig