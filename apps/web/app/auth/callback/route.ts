import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/account';

    if (code) {
        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore } as any);
        await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirect to account page after email verification
    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
