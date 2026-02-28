/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark native packages as external so they're not bundled into serverless functions
  serverExternalPackages: ['@xenova/transformers', 'onnxruntime-node', 'sharp'],

  // Ensure D3 and its sub-modules are transpiled correctly to preserve side-effects
  transpilePackages: ['d3', 'd3-selection', 'd3-transition', 'd3-hierarchy', 'd3-shape', 'd3-zoom', 'd3-ease', 'd3-interpolate', 'd3-color', 'd3-dispatch', 'd3-timer'],

  // Compress responses

  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  experimental: {
    // Limit concurrency to reduce memory usage
    cpus: 1,
    workerThreads: false,
    // Tree-shake heavy libraries — only bundle used exports
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'date-fns',
      // NOTE: d3 is excluded — d3-transition uses side-effect imports to patch
      // Selection.prototype, and the optimizer strips those. InteractiveTree is
      // already lazy-loaded via next/dynamic, so d3 only loads on-demand.
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      '@radix-ui/react-tabs',
      '@radix-ui/react-scroll-area',
      '@supabase/supabase-js',
    ],
  },

  // Static asset caching headers
  async headers() {
    return [
      {
        source: '/media/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },

          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ]
      }
    ]
  },
}

export default nextConfig
