/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@repo/ui'],
    typescript: {
        // TODO: Fix Supabase type issues with Next.js 15 route client
        ignoreBuildErrors: true,
    },
    images: {
        domains: ['iwxokvfmyyfxwusixqcc.supabase.co'],
    },
}

module.exports = nextConfig
