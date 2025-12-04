/** @type {import('next').NextConfig} */
const nextConfig = {
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
