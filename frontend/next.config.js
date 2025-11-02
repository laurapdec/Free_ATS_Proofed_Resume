/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_LINKEDIN_CLIENT_ID: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
  },
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  distDir: '.next',
  output: 'standalone'
}

module.exports = nextConfig