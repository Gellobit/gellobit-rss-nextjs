'use client';

import { useState, useEffect } from 'react';
import { Bot, Save, Key, CheckCircle, XCircle, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface AIConfig {
    id?: string;
    provider: 'openai' | 'anthropic' | 'deepseek' | 'gemini';
    model: string;
    api_key: string;
    is_active: boolean;
}

const DEFAULT_MODELS = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-7-sonnet-20250219', // Latest Claude 3.7 Sonnet
    deepseek: 'deepseek-chat',
    gemini: 'gemini-2.0-flash-exp' // Latest Gemini 2.0 Flash
};

export default function ManageAISettings() {
    const [providers, setProviders] = useState<AIConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
    const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

    // New provider form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProvider, setNewProvider] = useState<AIConfig>({
        provider: 'openai',
        model: DEFAULT_MODELS.openai,
        api_key: '',
        is_active: false
    });

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai-settings');
            const data = await res.json();

            if (res.ok) {
                setProviders(data.settings || []);
            } else {
                console.error('Error fetching providers:', data.error);
            }
        } catch (error) {
            console.error('Error fetching providers:', error);
        }
        setLoading(false);
    };

    const handleAddProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/admin/ai-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProvider),
            });

            const data = await res.json();

            if (res.ok) {
                setNewProvider({
                    provider: 'openai',
                    model: DEFAULT_MODELS.openai,
                    api_key: '',
                    is_active: false
                });
                setShowAddForm(false);
                fetchProviders();
            } else {
                alert('Error adding provider: ' + data.error);
            }
        } catch (error) {
            alert('Error adding provider: ' + error);
        }
        setSaving(false);
    };

    const handleUpdateProvider = async (provider: AIConfig) => {
        setSaving(true);

        try {
            const res = await fetch('/api/admin/ai-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(provider),
            });

            const data = await res.json();

            if (res.ok) {
                fetchProviders();
            } else {
                alert('Error updating provider: ' + data.error);
            }
        } catch (error) {
            alert('Error updating provider: ' + error);
        }
        setSaving(false);
    };

    const handleTest = async (provider: AIConfig) => {
        if (!provider.api_key) {
            setTestResults({
                ...testResults,
                [provider.provider]: { success: false, message: 'API key is required' }
            });
            return;
        }

        setTesting(provider.provider);
        setTestResults({ ...testResults, [provider.provider]: undefined as any });

        try {
            const res = await fetch('/api/admin/ai-settings/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: provider.provider,
                    api_key: provider.api_key,
                    model: provider.model,
                }),
            });

            const data = await res.json();

            if (res.ok && data.result.success) {
                setTestResults({
                    ...testResults,
                    [provider.provider]: {
                        success: true,
                        message: `✓ Connection successful! (${data.result.latency_ms}ms)`
                    }
                });
            } else {
                setTestResults({
                    ...testResults,
                    [provider.provider]: {
                        success: false,
                        message: `✗ Connection failed: ${data.result.error || data.error || 'Unknown error'}`
                    }
                });
            }
        } catch (error) {
            setTestResults({
                ...testResults,
                [provider.provider]: {
                    success: false,
                    message: `✗ Connection failed: ${error}`
                }
            });
        }
        setTesting(null);
    };

    const handleProviderChange = (providerType: AIConfig['provider']) => {
        setNewProvider({
            ...newProvider,
            provider: providerType,
            model: DEFAULT_MODELS[providerType]
        });
    };

    const toggleApiKeyVisibility = (providerId: string) => {
        setShowApiKeys({
            ...showApiKeys,
            [providerId]: !showApiKeys[providerId]
        });
    };

    const toggleActive = (provider: AIConfig) => {
        handleUpdateProvider({
            ...provider,
            is_active: !provider.is_active
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Bot size={20} /> AI Providers
                </h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 flex items-center gap-2"
                >
                    <Plus size={16} /> Add Provider
                </button>
            </div>

            {/* Add Provider Form */}
            {showAddForm && (
                <form onSubmit={handleAddProvider} className="mb-6 bg-slate-50 p-4 rounded-lg space-y-4 border-2 border-slate-200">
                    <h4 className="font-bold text-slate-700">Add New AI Provider</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Provider</label>
                            <select
                                className="border p-2 rounded w-full"
                                value={newProvider.provider}
                                onChange={e => handleProviderChange(e.target.value as AIConfig['provider'])}
                            >
                                <option value="openai">OpenAI (GPT-4o-mini)</option>
                                <option value="anthropic">Anthropic (Claude 3.7 Sonnet)</option>
                                <option value="deepseek">DeepSeek (DeepSeek-Chat)</option>
                                <option value="gemini">Google (Gemini 2.0 Flash)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Model</label>
                            <input
                                type="text"
                                className="border p-2 rounded w-full"
                                value={newProvider.model}
                                onChange={e => setNewProvider({ ...newProvider, model: e.target.value })}
                                placeholder="e.g. gpt-4o-mini"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                            <Key size={14} /> API Key
                        </label>
                        <input
                            type="text"
                            className="border p-2 rounded w-full font-mono text-sm"
                            value={newProvider.api_key}
                            onChange={e => setNewProvider({ ...newProvider, api_key: e.target.value })}
                            placeholder="Enter API key..."
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="new_is_active"
                            checked={newProvider.is_active}
                            onChange={e => setNewProvider({ ...newProvider, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="new_is_active" className="text-sm text-slate-700">Set as active provider</label>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={16} /> {saving ? 'Adding...' : 'Add Provider'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="bg-slate-300 text-slate-700 px-4 py-2 rounded font-bold hover:bg-slate-400"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Providers List */}
            {loading ? (
                <p className="text-slate-500">Loading providers...</p>
            ) : providers.length === 0 ? (
                <p className="text-center text-slate-400 italic py-8">No AI providers configured yet. Add one to get started!</p>
            ) : (
                <div className="space-y-4">
                    {providers.map((provider) => (
                        <div key={provider.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-bold text-slate-900 capitalize">{provider.provider}</h4>
                                        {provider.is_active && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-green-100 text-green-700">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600">Model: <span className="font-mono">{provider.model}</span></p>
                                </div>
                                <button
                                    onClick={() => toggleActive(provider)}
                                    disabled={saving}
                                    className={`px-3 py-1 rounded text-sm font-bold ${
                                        provider.is_active
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    } disabled:opacity-50`}
                                >
                                    {provider.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">API Key</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        className="border p-2 rounded flex-1 font-mono text-sm"
                                        value={provider.api_key || ''}
                                        onChange={e => {
                                            const updated = providers.map(p =>
                                                p.id === provider.id ? { ...p, api_key: e.target.value } : p
                                            );
                                            setProviders(updated);
                                        }}
                                    />
                                    <button
                                        onClick={() => handleUpdateProvider(provider)}
                                        disabled={saving}
                                        className="bg-blue-600 text-white px-3 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Test Result */}
                            {testResults[provider.provider] && (
                                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                                    testResults[provider.provider].success
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-red-50 border border-red-200'
                                }`}>
                                    {testResults[provider.provider].success ? (
                                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <p className={`text-sm ${
                                        testResults[provider.provider].success ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                        {testResults[provider.provider].message}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleTest(provider)}
                                    disabled={testing === provider.provider || !provider.api_key}
                                    className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {testing === provider.provider ? (
                                        <>Testing...</>
                                    ) : (
                                        <>
                                            <CheckCircle size={16} /> Test Connection
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
