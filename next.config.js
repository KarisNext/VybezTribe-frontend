
/** @type {import('next').NextConfig} */
const path = require('path');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  images: {
    unoptimized: true,
  },
  
  trailingSlash: true,
  
  // Webpack configuration for FRONTEND import resolution only
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configure path aliases for TypeScript/React components
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/types': path.resolve(__dirname, 'src/types'),
    };
    
    // Ensure proper extension resolution for TypeScript/React files
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    
    // Add case-sensitive paths plugin for Linux (Render) compatibility
    config.plugins.push(new CaseSensitivePathsPlugin());
    
    return config;
  },
  
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
