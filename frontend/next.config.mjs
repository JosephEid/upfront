/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "eedl9plfbeavjgfp.public.blob.vercel-storage.com",
                port: "",
            },
        ],
    },
};

export default nextConfig;
