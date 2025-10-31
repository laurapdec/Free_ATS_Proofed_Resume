/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Ensure we always have a valid API URL that starts with http:// or https://
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