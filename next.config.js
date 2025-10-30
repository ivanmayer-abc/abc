const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    domains: ["res.cloudinary.com"],
    unoptimized: true 
  },
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://abc-chi-green.vercel.app/api/:path*',
        permanent: false,
      },
    ]
  }
}

module.exports = withNextIntl(nextConfig);