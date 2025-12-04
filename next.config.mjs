/** @type {import('next').NextConfig} */
const nextConfig = {
  // Opt-out Prisma from Server Components bundling:
  serverExternalPackages: ["@prisma/client"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
