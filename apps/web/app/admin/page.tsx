import { createServerSupabaseClient } from '../../utils/supabase-server';
import { redirect } from 'next/navigation';
import CreateOpportunityForm from './CreateOpportunityForm';
import ManageFeeds from './ManageFeeds';
import ManageAISettings from './ManageAISettings';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
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

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
                    <span className="bg-yellow-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        Admin Mode
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4">Manual Entry</h2>
                        <CreateOpportunityForm />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-4">Automation</h2>
                        <ManageFeeds />
                        <ManageAISettings />
                    </div>
                </div>
            </div>
        </div>
    );
}
