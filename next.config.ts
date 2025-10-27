import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  basePath: '/farm.github.io',
  assetPrefix: '/farm.github.io/',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/farm.github.io',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    // Ignore genkit and AI-related modules during client-side build
    config.externals = config.externals || [];
    config.externals.push({
      'genkit': 'commonjs genkit',
      '@genkit-ai/core': 'commonjs @genkit-ai/core',
      '@genkit-ai/google-genai': 'commonjs @genkit-ai/google-genai',
    });
    return config;
  },
};

export default nextConfig;
