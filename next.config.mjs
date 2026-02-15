/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  */
  // Ensure Turbopack is not enabled via config
  experimental: {
    optimizePackageImports: true
  },
  // Watcher Optimization for Windows disabled for production readiness check
}

export default nextConfig
