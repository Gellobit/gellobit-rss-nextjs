'use client';

import { useState, useEffect } from 'react';
import { Bot, Save, Key, CheckCircle, XCircle } from 'lucide-react';

interface AIConfig {
    id?: string;
    provider: 'openai' | 'anthropic' | 'deepseek' | 'gemini';
    model: string;
    api_key: string;
    is_active: boolean;
}

export default function ManageAISettings() {
    const [config, setConfig] = useState<AIConfig>({
        provider: 'openai',
        model: 'gpt-4o-mini',
        api_key: '',
        is_active: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai-settings');
            const data = await res.json();

            if (res.ok && data.settings) {
                setConfig(data.settings);
            }
        } catch (error) {
            console.error('Error fetching AI config:', error);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setTestResult(null);

        try {
            const res = await fetch('/api/admin/ai-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await res.json();

            if (res.ok) {
                alert('AI Settings saved successfully!');
                fetchConfig(); // Refresh to get ID if it was an insert
            } else {
                alert('Error saving settings: ' + data.error);
            }
        } catch (error) {
            alert('Error saving settings: ' + error);
        }
        setSaving(false);
    };

    const handleTest = async () => {
        if (!config.api_key) {
            setTestResult({ success: false, message: 'Please enter an API key first' });
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const res = await fetch('/api/admin/ai-settings/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: config.provider,
                    api_key: config.api_key,
                    model: config.model,
                }),
            });

            const data = await res.json();

            if (res.ok && data.result.success) {
                setTestResult({
                    success: true,
                    message: `✓ Connection successful! Response: "${data.result.message}"`
                });
            } else {
                setTestResult({
                    success: false,
                    message: `✗ Connection failed: ${data.result.error || data.error || 'Unknown error'}`
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: `✗ Connection failed: ${error}`
            });
        }
        setTesting(false);
    };

    const handleProviderChange = (provider: AIConfig['provider']) => {
        const defaultModels = {
            openai: 'gpt-4o-mini',
            anthropic: 'claude-3-5-sonnet-20241022',
            deepseek: 'deepseek-chat',
            gemini: 'gemini-1.5-flash'
        };

        setConfig({
            ...config,
            provider,
            model: defaultModels[provider]
        });
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
                                onChange={e => handleProviderChange(e.target.value as AIConfig['provider'])}
                            >
                                <option value="openai">OpenAI (GPT-4o-mini)</option>
                                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                                <option value="deepseek">DeepSeek (DeepSeek-Chat)</option>
                                <option value="gemini">Google (Gemini 1.5 Flash)</option>
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

                    {/* Test Connection Result */}
                    {testResult && (
                        <div className={`p-3 rounded-lg flex items-start gap-2 ${
                            testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                            {testResult.success ? (
                                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                {testResult.message}
                            </p>
                        </div>
                    )}

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

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={testing || !config.api_key}
                            className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testing ? (
                                <>Testing...</>
                            ) : (
                                <>
                                    <CheckCircle size={16} /> Test Connection
                                </>
                            )}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
