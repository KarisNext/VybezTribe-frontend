/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  images: {
    unoptimized: true,
  },
  
  trailingSlash: true,
  
  // Webpack configuration to ensure proper path resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configure path aliases with absolute paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/types': path.resolve(__dirname, 'src/types'),
    };
    
    // Ensure case-sensitive paths (important for Linux/Render)
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    
    // Return the modified config
    return config;
  },
  
  // Optional: Experimental features
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
