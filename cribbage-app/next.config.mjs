/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    // Timestamp build ID ensures JS/CSS chunks are unique per deploy
    return `build-${Date.now()}`;
  },
  async headers() {
    return [
      {
        // Static images — cache aggressively (30 days)
        // These change rarely; when they do, filenames change or build ID busts cache
        source: '/card-backs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, immutable' },
        ],
      },
      {
        // Next.js build chunks — immutable because build ID makes URLs unique per deploy
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // API routes — never cache
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // HTML pages — no cache so version checks and updates work immediately
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
