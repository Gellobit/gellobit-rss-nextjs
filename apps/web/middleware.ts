import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/opportunities',
    '/saved',
    '/account',
    '/admin',
]

// Routes that should never be indexed by search engines
const NOINDEX_ROUTES = [
    '/opportunities',
    '/saved',
    '/account',
    '/admin',
    '/auth',
]

// Known app route prefixes (these skip the 410 check)
const KNOWN_ROUTE_PREFIXES = [
    '/auth',
    '/admin',
    '/opportunities',
    '/saved',
    '/account',
    '/api',
    '/blog',
    '/pricing',
    '/p/',
    '/_next',
]

// Generate 410 Gone HTML response
function generate410Response(): Response {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>410 - Page Permanently Removed</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #1a1a1a;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            font-size: 1.875rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
        }
        p {
            color: #64748b;
            margin-bottom: 1.5rem;
            max-width: 400px;
        }
        a {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #1a1a1a;
            color: white;
            text-decoration: none;
            border-radius: 0.5rem;
            font-weight: 700;
            transition: background 0.2s;
        }
        a:hover { background: #374151; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🚫</div>
        <h1>Page Permanently Removed</h1>
        <p>This content has been permanently deleted and is no longer available.</p>
        <a href="/">Go to Home</a>
    </div>
</body>
</html>`

    return new Response(html, {
        status: 410,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow',
        },
    })
}

// Check if content exists in categories, pages, or posts tables
async function contentExists(slug: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        // If we can't check, allow the request to proceed
        return true
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check categories table first (for /category-slug/ URLs)
    const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()

    if (category) return true

    // Check pages table
    const { data: page } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

    if (page) return true

    // Check posts table
    const { data: post } = await supabase
        .from('posts')
        .select('id')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

    return !!post
}

// Check if this is a root-level slug route (like /old-wordpress-post)
function isRootSlugRoute(pathname: string): boolean {
    // Skip home page
    if (pathname === '/') return false

    // Skip known routes
    if (KNOWN_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
        return false
    }

    // Check if it's a single-level path (no nested paths)
    const segments = pathname.split('/').filter(Boolean)
    return segments.length === 1
}

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname

    // For root-level slug routes, check if content exists
    // If not, return 410 Gone (for old WordPress URLs)
    if (isRootSlugRoute(pathname)) {
        const slug = pathname.slice(1) // Remove leading slash
        const exists = await contentExists(slug)

        if (!exists) {
            return generate410Response()
        }
    }

    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Check if route requires authentication
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

    if (isProtectedRoute && !session) {
        const redirectUrl = new URL('/auth', req.url)
        redirectUrl.searchParams.set('redirect', pathname + req.nextUrl.search)
        return NextResponse.redirect(redirectUrl)
    }

    // Add X-Robots-Tag header for protected/private routes
    // This tells crawlers not to index even if they somehow access the page
    const isNoIndexRoute = NOINDEX_ROUTES.some(route => pathname.startsWith(route))
    if (isNoIndexRoute) {
        res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
    }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|sitemap.xml|robots.txt).*)'],
}
