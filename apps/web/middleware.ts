import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
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

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    const pathname = req.nextUrl.pathname

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
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
