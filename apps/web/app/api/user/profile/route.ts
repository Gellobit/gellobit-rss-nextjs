import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - Get current user profile
export async function GET(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        // Try to get existing profile
        let { data: profile, error } = await adminSupabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // If profile doesn't exist, create it
        if (error && error.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await adminSupabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    role: 'user',
                    membership_type: 'free',
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating profile:', createError);
                return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
            }

            profile = newProfile;
        } else if (error) {
            console.error('Error fetching profile:', error);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Combine with auth user data
        return NextResponse.json({
            profile: {
                ...profile,
                email: user.email,
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { display_name, avatar_url } = body;

        const adminSupabase = createAdminClient();

        // Build update data - only allow certain fields
        const updateData: Record<string, any> = {};
        if (display_name !== undefined) updateData.display_name = display_name;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

        const { data, error } = await adminSupabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            profile: {
                ...data,
                email: user.email,
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
