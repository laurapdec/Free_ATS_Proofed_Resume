/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_LINKEDIN_CLIENT_ID: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const baseUrl = apiUrl.startsWith('http://') || apiUrl.startsWith('https://')
      ? apiUrl
      : `http://${apiUrl}`;
    
    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`
      }
    ];
  }
}

module.exports = nextConfig