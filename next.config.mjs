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

  // Mark native packages as external so they're not bundled into serverless functions
  serverExternalPackages: ['@xenova/transformers', 'onnxruntime-node', 'sharp'],
}

export default nextConfig
