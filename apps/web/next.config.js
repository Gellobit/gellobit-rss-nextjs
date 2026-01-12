/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@repo/ui'],
    images: {
        domains: ['iwxokvfmyyfxwusixqcc.supabase.co'],
    },
}

module.exports = nextConfig
