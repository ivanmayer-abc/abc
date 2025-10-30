const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    domains: [
      "res.cloudinary.com"
    ]
  }
}

module.exports = withNextIntl(nextConfig);