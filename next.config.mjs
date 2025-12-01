/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for iframe compatibility
  output: 'standalone',
  
  // Disable caching in development and iframe contexts
  generateEtags: false,
  
  // Headers to prevent caching in iframes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },

  // Webpack config to handle iframe issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Disable service worker in iframe
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;