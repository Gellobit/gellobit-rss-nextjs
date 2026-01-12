'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Info } from 'lucide-react';

interface PromptTemplate {
    opportunity_type: string;
    content: string;
}

const opportunityTypes = [
    { value: 'contest', label: 'Contest' },
    { value: 'giveaway', label: 'Giveaway' },
    { value: 'sweepstakes', label: 'Sweepstakes' },
    { value: 'dream_job', label: 'Dream Job' },
    { value: 'get_paid_to', label: 'Get Paid To' },
    { value: 'instant_win', label: 'Instant Win' },
    { value: 'job_fair', label: 'Job Fair' },
    { value: 'scholarship', label: 'Scholarship' },
    { value: 'volunteer', label: 'Volunteering' },
    { value: 'free_training', label: 'Free Training' },
    { value: 'promo', label: 'Promo' },
];

export default function PromptsSettings() {
    const [selectedType, setSelectedType] = useState('giveaway');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchPrompt(selectedType);
    }, [selectedType]);

    const fetchPrompt = async (type: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/prompts/${type}`);
            const data = await res.json();
            if (res.ok) {
                setPrompt(data.prompt || '');
            }
        } catch (error) {
            console.error('Error fetching prompt:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/admin/prompts/${selectedType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Prompt saved successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save prompt' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save prompt' });
        }
        setSaving(false);
    };

    const handleReset = async () => {
        if (!confirm('Reset to default prompt? This will discard your custom changes.')) return;

        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/admin/prompts/${selectedType}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await fetchPrompt(selectedType);
                setMessage({ type: 'success', text: 'Prompt reset to default!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to reset prompt' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to reset prompt' });
        }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-bold mb-1">Customize AI Prompts</p>
                    <p className="text-blue-800">
                        Edit the prompts used by AI to generate content for each opportunity type.
                        The AI returns a single JSON response with title, excerpt, content, and metadata.
                    </p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Type Selector */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Select Opportunity Type
                </label>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {opportunityTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Available Variables */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Available Variables</h3>
                <div className="text-xs text-slate-700 space-y-1">
                    <p><code className="bg-slate-200 px-1 py-0.5 rounded">{'{{title}}'}</code> - Original RSS item title</p>
                    <p><code className="bg-slate-200 px-1 py-0.5 rounded">{'{{description}}'}</code> - Original RSS description</p>
                    <p><code className="bg-slate-200 px-1 py-0.5 rounded">{'{{content}}'}</code> - Full scraped content from URL</p>
                    <p><code className="bg-slate-200 px-1 py-0.5 rounded">{'{{source_url}}'}</code> - Original article URL</p>
                </div>
            </div>

            {/* Prompt Editor */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                    Prompt Template
                </label>
                {loading ? (
                    <div className="flex items-center justify-center py-12 border border-slate-300 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={20}
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your custom prompt here..."
                    />
                )}
                <p className="text-xs text-slate-500">
                    The AI must return valid JSON with fields: valid, title, excerpt, content, deadline, prize_value, requirements, location, confidence_score
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Prompt
                        </>
                    )}
                </button>
                <button
                    onClick={handleReset}
                    disabled={saving || loading}
                    className="bg-white text-slate-700 px-6 py-2 rounded-lg font-bold border-2 border-slate-200 hover:border-slate-300 transition-colors disabled:opacity-50"
                >
                    Reset to Default
                </button>
            </div>
        </div>
    );
}
