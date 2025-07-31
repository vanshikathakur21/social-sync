/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Cloudflare Pages deployment
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  // Disable server-side features for static export
  experimental: {
    // Disable features that require server-side rendering
  }
}

module.exports = nextConfig