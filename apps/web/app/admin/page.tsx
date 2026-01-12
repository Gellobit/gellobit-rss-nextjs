import { createServerSupabaseClient } from '../../utils/supabase-server';
import { redirect } from 'next/navigation';
import AdminLayout from './AdminLayout';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
    const params = await searchParams;
    const supabase = await createServerSupabaseClient();

    // Check Authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/auth');
    }

    // Check Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
                    <p className="text-slate-500">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return <AdminLayout initialSection={params.section || 'dashboard'} />;
}
