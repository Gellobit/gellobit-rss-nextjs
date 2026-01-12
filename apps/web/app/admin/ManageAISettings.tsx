'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Bot, Save, Key } from 'lucide-react';

export default function ManageAISettings() {
    const supabase = createClientComponentClient();
    const [config, setConfig] = useState({ id: '', provider: 'openai', model: 'gpt-4o-mini', api_key: '', is_active: true });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ai_settings')
            .select('*')
            .single();

        if (data) {
            setConfig(data);
        } else if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching AI config:', error);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            provider: config.provider,
            model: config.model,
            api_key: config.api_key,
            is_active: config.is_active
        };

        let error;
        if (config.id) {
            const { error: updateError } = await supabase
                .from('ai_settings')
                .update(payload)
                .eq('id', config.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('ai_settings')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            alert('Error saving settings: ' + error.message);
        } else {
            alert('AI Settings saved successfully!');
            fetchConfig(); // Refresh to get ID if it was an insert
        }
        setSaving(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Bot size={20} /> AI Configuration
            </h3>

            {loading ? (
                <p className="text-slate-500">Loading settings...</p>
            ) : (
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Provider</label>
                            <select
                                className="border p-2 rounded w-full"
                                value={config.provider}
                                onChange={e => setConfig({ ...config, provider: e.target.value })}
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic (Claude)</option>
                                <option value="deepseek">DeepSeek</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Model</label>
                            <input
                                type="text"
                                className="border p-2 rounded w-full"
                                value={config.model}
                                onChange={e => setConfig({ ...config, model: e.target.value })}
                                placeholder="e.g. gpt-4o-mini"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                            <Key size={14} /> API Key
                        </label>
                        <input
                            type="password"
                            className="border p-2 rounded w-full"
                            value={config.api_key || ''}
                            onChange={e => setConfig({ ...config, api_key: e.target.value })}
                            placeholder="sk-..."
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Stored securely. Required for automated content generation.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={config.is_active}
                            onChange={e => setConfig({ ...config, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="text-sm text-slate-700">Enable AI Processing</label>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 flex items-center gap-2"
                    >
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            )}
        </div>
    );
}
