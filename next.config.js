/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  images: {
    unoptimized: true,
  },

  trailingSlash: true,

  // ADD THIS WEBPACK CONFIGURATION TO FIX IMPORT ALIASES
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configure path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
      '@/components': require('path').resolve(__dirname, 'src/components'),
      '@/app': require('path').resolve(__dirname, 'src/app'),
      '@/lib': require('path').resolve(__dirname, 'src/lib'),
      '@/types': require('path').resolve(__dirname, 'src/types'),
    };

    // Important: return the modified config
    return config;
  },

  // Optional: Add experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig;
