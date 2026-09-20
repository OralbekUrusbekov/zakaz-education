/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/students', destination: '/community', permanent: true },
      { source: '/parents', destination: '/community', permanent: true },
      { source: '/admissions', destination: '/learning', permanent: true },
    ]
  },
  output: 'standalone',
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
