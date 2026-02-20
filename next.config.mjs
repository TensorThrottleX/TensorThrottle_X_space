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

  // Watcher Optimization for Windows disabled for production readiness check
  serverExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
}

export default nextConfig
