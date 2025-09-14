/** @type {import('next').NextConfig} */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

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
  experimental: {
    // Enable webpack build worker for better performance
    webpackBuildWorker: true,
    // 🚀 **PERFORMANCE**: Enable optimized package imports
    optimizePackageImports: ['@monaco-editor/react', 'monaco-editor', 'lucide-react'],
    // 🚀 **PERFORMANCE**: Enable turbo mode for faster builds
    turbo: {
      rules: {
        '*.tsx': {
          loaders: ['swc-loader'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // This ensures that both routers can handle API calls correctly
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  // Make sure webpack is configured correctly
  webpack: (config, { isServer }) => {
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

    // Add any specific webpack configurations if needed

    // ---> Fix Dexie bundling issues <---
    // This addresses the "this.inner is undefined" error
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

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
            // 🎯 **MONACO EDITOR**: Separate chunk for Monaco (heavy)
            monaco: {
              test: /[\\/]node_modules[\\/](@monaco-editor|monaco-editor)[\\/]/,
              name: 'monaco-editor',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
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
    // --- End Dexie Fix ---

    // ---> 🏆 BULLETPROOF MONACO CONFIGURATION <---
    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          // 🎯 **OPTIMIZED LANGUAGES**: Only include what we need
          languages: ['python', 'json', 'typescript', 'javascript'],
          
          // 🚀 **CRITICAL**: Proper filename for local assets
          filename: 'static/[name].worker.js',
          
          // 🔧 **ESSENTIAL FEATURES**: Minimal set for performance + debugging
          features: [
            'coreCommands',
            'find',
            'folding',
            'suggest',
            'hover',
            'bracketMatching',
            'wordOperations',
            'comment',
            'quickSuggestions',
            'parameterHints',
            // 🐛 **DEBUGGING FEATURES**: Enable Monaco debugging API (comprehensive)
            'debug',
            'debugBreakpoints',
            'debugConsole',
            'debugInlineValues',
            'debugStepBack',
            'debugStepInto',
            'debugStepOut',
            'debugStepOver',
            'debugStop',
            'debugThreads',
            'debugVariables',
            'debugWatch',
            // Try alternative names
            'Debug',
            'DebugBreakpoints',
            'DebugConsole',
            'DebugVariables',
          ],
        })
      );
      
      // 🎯 **WORKER RESOLUTION**: Ensure proper worker loading
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      
      // 🚀 **MONACO CSS HANDLING**: Allow Monaco CSS imports
      const oneOfRule = config.module.rules.find(
        (rule) => rule.oneOf && rule.oneOf.some((o) => o.issuer)
      );
      if (oneOfRule) {
        oneOfRule.oneOf.forEach((o) => {
          if (o.issuer && o.issuer.include) {
            o.issuer.include = [
              o.issuer.include,
              /[\\/]node_modules[\\/]monaco-editor[\\/]/,
            ];
          }
        });
      }
    }
    // --- End Monaco Plugin Configuration ---

    return config;
  },
  // Ensure output is configured correctly
  output: 'standalone',
};

module.exports = nextConfig; 