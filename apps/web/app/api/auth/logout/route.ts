import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';

export async function POST() {
    try {
        const supabase = await createRouteClient();
        await supabase.auth.signOut();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    }
}
