/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  serverExternalPackages: [
    'sequelize',
    'mysql2',
    'pg-hstore',
  ],
}

export default nextConfig;