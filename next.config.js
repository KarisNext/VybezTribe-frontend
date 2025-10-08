/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  images: {
    unoptimized: true,
  },
  
  trailingSlash: true,
  
  // Simple webpack configuration
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    
    return config;
  }
};

module.exports = nextConfig;
