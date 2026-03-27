/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.cdn-website.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '*.firebaseapp.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
  async redirects() {
    return [
      {
        source: '/partner-offers',
        destination: '/offers',
        permanent: true,
      },
      {
        source: '/knowledge-center',
        destination: '/resources',
        permanent: true,
      },
      {
        source: '/contact-one',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/membership',
        destination: '/',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
