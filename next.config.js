/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests from your custom domain in development
  allowedDevOrigins: ['asembli.org', 'www.asembli.org'],
  // Instrumentation hook is now enabled by default in Next.js 16+
  // Disable source maps to avoid parsing errors
  productionBrowserSourceMaps: false,
  // Suppress source map warnings in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Allow images from external domains (Imgbb hosting)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.imgbb.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
