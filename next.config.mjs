/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
  async rewrites() {
    return [
      {
        source: '/services',
        destination: '/services.html',
      },
    ]
  },
  allowedDevOrigins: ["https://9000-firebase-studio-1773123432145.cluster-a6zx3cwnb5hnuwbgyxmofxpkfe.cloudworkstations.dev"],
};

export default nextConfig;
