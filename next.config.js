/** @type {import('next').NextConfig} */
// Removed MonacoWebpackPlugin; let @monaco-editor/react manage workers
const path = require('path');
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: false, // 🚫 DISABLED: Prevents duplicate Monaco editor instances
  // Configure external packages to be bundled
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TS errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors during build
  },
  // experimental: {
  //   // Enable webpack build worker for better performance (only for webpack builds)
  //   webpackBuildWorker: true,
  //   // 🚀 **PERFORMANCE**: Enable optimized package imports
  //   optimizePackageImports: ['lucide-react'],
  // },
  // 🚀 **TURBOPACK**: Modern Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    resolveAlias: {
      'dexie': require.resolve('dexie'),
    },
  },
  // 🚀 **PERFORMANCE**: Let Turbopack handle .tsx files natively (no custom rules needed)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Silence monorepo root inference warning by pointing to the workspace root
  outputFileTracingRoot: path.join(__dirname, '..'),
  // This ensures that both routers can handle API calls correctly
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  // Webpack configuration (only applied when NOT using Turbopack)
  // Turbopack handles most of these optimizations natively
  ...(!process.env.TURBOPACK && {
    webpack: (config, { isServer, dev }) => {
      // Exclude server-only packages from client bundle
      if (!isServer) {
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
        
        // Exclude nodemailer and other server-only packages
        config.externals = config.externals || [];
        config.externals.push('nodemailer');
      }

      // Ensure proper module resolution for Dexie
      config.resolve.alias = {
        ...config.resolve.alias,
        'dexie': require.resolve('dexie'),
      };

      // 🚀 **PERFORMANCE**: Optimize chunks to prevent bundling issues and improve loading
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            ...config.optimization.splitChunks,
            chunks: 'all',
            maxSize: 244000, // Split chunks larger than 244KB
            cacheGroups: {
              ...config.optimization.splitChunks?.cacheGroups,
              // 🎯 **EDITOR SYSTEM**: Separate chunk for our editor components
              editor: {
                test: /[\\/]src[\\/](components[\\/]editor|lib[\\/]editor)[\\/]/,
                name: 'editor-system',
                chunks: 'all',
                priority: 25,
                enforce: true,
              },
              // 🎯 **DEXIE**: Keep existing Dexie optimization
              dexie: {
                test: /[\\/]node_modules[\\/]dexie[\\/]/,
                name: 'dexie',
                chunks: 'all',
                priority: 20,
              },
              // 🎯 **UI COMPONENTS**: Separate chunk for UI components
              ui: {
                test: /[\\/]node_modules[\\/](lucide-react|@radix-ui)[\\/]/,
                name: 'ui-components',
                chunks: 'all',
                priority: 15,
              },
              // 🎯 **VENDOR**: Default vendor chunk for other node_modules
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
              },
            },
          },
        };
      }

      return config;
    },
  }),
  // Ensure output is configured correctly (only in production)
  output: isProd ? 'standalone' : undefined,
};

module.exports = nextConfig; 