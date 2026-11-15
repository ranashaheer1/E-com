/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Bundle Express API deps for the catch-all serverless route
  experimental: {
    outputFileTracingIncludes: {
      "/api/**": ["./server/**/*"],
    },
  },
};

export default nextConfig;
