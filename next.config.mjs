/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Let Next tree-shake per-icon so importing from the @phosphor-icons/react
  // barrel doesn't pull the whole set into the bundle.
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  images: {
    // Mock data uses remote placeholder images during the design phase.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
