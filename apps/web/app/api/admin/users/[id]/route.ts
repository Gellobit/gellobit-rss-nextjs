import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - Get single user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data, error } = await adminSupabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: data });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH - Update user (role, status, membership)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Prevent admin from modifying their own role/status
        if (id === user.id) {
            return NextResponse.json(
                { error: 'Cannot modify your own account' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { role, status, membership_type, membership_expires_at } = body;

        // Validate role
        if (role && !['admin', 'user'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be admin or user' },
                { status: 400 }
            );
        }

        // Validate status
        if (status && !['active', 'suspended'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be active or suspended' },
                { status: 400 }
            );
        }

        // Validate membership_type
        if (membership_type && !['free', 'premium', 'lifetime'].includes(membership_type)) {
            return NextResponse.json(
                { error: 'Invalid membership type' },
                { status: 400 }
            );
        }

        // Build update data
        const updateData: Record<string, any> = {};
        if (role !== undefined) updateData.role = role;
        if (status !== undefined) updateData.status = status;
        if (membership_type !== undefined) updateData.membership_type = membership_type;
        if (membership_expires_at !== undefined) updateData.membership_expires_at = membership_expires_at;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        const { data, error } = await adminSupabase
            .from('profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating user:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ user: data });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Prevent admin from deleting themselves
        if (id === user.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Delete user's related data first (favorites, notifications, etc.)
        await adminSupabase.from('user_favorites').delete().eq('user_id', id);
        await adminSupabase.from('user_notification_settings').delete().eq('user_id', id);
        await adminSupabase.from('user_read_history').delete().eq('user_id', id);

        // Delete profile
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // Delete from Supabase Auth (requires admin client)
        const { error: authError } = await adminSupabase.auth.admin.deleteUser(id);

        if (authError) {
            console.error('Error deleting auth user:', authError);
            // Profile already deleted, log but don't fail
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
