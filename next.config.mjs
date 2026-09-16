/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      // Server Action request bodies (multipart file uploads) default to a 1 MB
      // cap in Next.js — the same as our own ID-card size limit, so a file just
      // under our limit could still be rejected at the transport layer before
      // our friendly validation in app/actions/uploads.ts ever runs. Raise the
      // transport cap so our own size check is always the one that fires.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      // Google OAuth profile pictures
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // Public CDN / MinIO proxy — all uploaded files served from here
      {
        protocol: "https",
        hostname: "files.omnicassion.com",
        pathname: "/**",
      },
      // Legacy: direct MinIO IP (keep for any old stored URLs)
      {
        protocol: process.env.MINIO_USE_SSL === "true" ? "https" : "http",
        hostname: process.env.MINIO_ENDPOINT || "187.77.188.200",
        port: process.env.MINIO_PORT || "9000",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
