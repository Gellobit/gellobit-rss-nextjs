import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Protect specific routes (e.g., dashboard, pro features)
    // For basic parity, we might not block anything yet, but this sets the stage.
    // if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    //   return NextResponse.redirect(new URL('/auth', req.url))
    // }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
