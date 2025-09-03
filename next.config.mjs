/**
 * Next.js configuration.
 * - Experimental/edge runtime decisions can be toggled here later.
 * - Images domain allowlist, internationalization, etc.
 */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  }
};

export default nextConfig;
