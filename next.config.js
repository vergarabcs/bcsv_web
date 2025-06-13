/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add PWA configuration
  reactStrictMode: true,
  // Configure headers to allow service worker registration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  }
}

export default nextConfig