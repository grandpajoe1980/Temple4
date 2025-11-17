/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable source maps to avoid parsing errors
  productionBrowserSourceMaps: false,
  // Suppress source map warnings in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
