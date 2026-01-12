'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function CreateOpportunityForm() {
    const supabase = createClientComponentClient();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'giveaway',
        prize_value: '',
        source_url: '',
        is_verified: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('opportunities')
            .insert([formData]);

        if (error) {
            alert('Error creating opportunity: ' + error.message);
        } else {
            alert('Opportunity created successfully!');
            setFormData({ ...formData, title: '', description: '', prize_value: '', source_url: '' });
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4">Add New Opportunity</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Title"
                    className="border p-2 rounded w-full"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                />
                <select
                    className="border p-2 rounded w-full"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                    <option value="giveaway">Giveaway</option>
                    <option value="job">Job</option>
                    <option value="scholarship">Scholarship</option>
                </select>
            </div>

            <textarea
                placeholder="Description"
                className="border p-2 rounded w-full h-24"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Prize Value (e.g. $1000)"
                    className="border p-2 rounded w-full"
                    value={formData.prize_value}
                    onChange={e => setFormData({ ...formData, prize_value: e.target.value })}
                />
                <input
                    type="url"
                    placeholder="Source URL"
                    className="border p-2 rounded w-full"
                    value={formData.source_url}
                    onChange={e => setFormData({ ...formData, source_url: e.target.value })}
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Create Opportunity'}
            </button>
        </form>
    );
}
