'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Info, Edit, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface PromptConfig {
    opportunity_type: string;
    prompt: string;
    source: 'custom' | 'default';
    isEditing?: boolean;
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
    const [prompts, setPrompts] = useState<PromptConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; promptType?: string } | null>(null);

    useEffect(() => {
        fetchAllPrompts();
    }, []);

    const fetchAllPrompts = async () => {
        setLoading(true);
        try {
            const promptsData: PromptConfig[] = await Promise.all(
                opportunityTypes.map(async (type) => {
                    const res = await fetch(`/api/admin/prompts/${type.value}`);
                    const data = await res.json();
                    return {
                        opportunity_type: type.value,
                        prompt: data.prompt || '',
                        source: data.source || 'default',
                        isEditing: false,
                    };
                })
            );
            setPrompts(promptsData);
        } catch (error) {
            console.error('Error fetching prompts:', error);
        }
        setLoading(false);
    };

    const toggleEdit = (opportunityType: string) => {
        setPrompts(prompts.map(p =>
            p.opportunity_type === opportunityType
                ? { ...p, isEditing: !p.isEditing }
                : p
        ));
        setMessage(null);
    };

    const handlePromptChange = (opportunityType: string, newPrompt: string) => {
        setPrompts(prompts.map(p =>
            p.opportunity_type === opportunityType
                ? { ...p, prompt: newPrompt }
                : p
        ));
    };

    const handleSave = async (opportunityType: string) => {
        setSaving(opportunityType);
        setMessage(null);

        const promptConfig = prompts.find(p => p.opportunity_type === opportunityType);
        if (!promptConfig) return;

        try {
            const res = await fetch(`/api/admin/prompts/${opportunityType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptConfig.prompt }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({
                    type: 'success',
                    text: 'Prompt saved successfully!',
                    promptType: opportunityType
                });
                // Update source to custom
                setPrompts(prompts.map(p =>
                    p.opportunity_type === opportunityType
                        ? { ...p, source: 'custom', isEditing: false }
                        : p
                ));
            } else {
                setMessage({
                    type: 'error',
                    text: data.error || 'Failed to save prompt',
                    promptType: opportunityType
                });
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage({
                type: 'error',
                text: 'Failed to save prompt',
                promptType: opportunityType
            });
        }
        setSaving(null);
    };

    const handleReset = async (opportunityType: string) => {
        const promptLabel = opportunityTypes.find(t => t.value === opportunityType)?.label;
        if (!confirm(`Reset ${promptLabel} prompt to default? This will discard your custom changes.`)) return;

        setSaving(opportunityType);
        setMessage(null);

        try {
            const res = await fetch(`/api/admin/prompts/${opportunityType}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Fetch the default prompt
                const getRes = await fetch(`/api/admin/prompts/${opportunityType}`);
                const data = await getRes.json();

                setPrompts(prompts.map(p =>
                    p.opportunity_type === opportunityType
                        ? { ...p, prompt: data.prompt, source: 'default', isEditing: false }
                        : p
                ));

                setMessage({
                    type: 'success',
                    text: 'Prompt reset to default!',
                    promptType: opportunityType
                });
            } else {
                setMessage({
                    type: 'error',
                    text: 'Failed to reset prompt',
                    promptType: opportunityType
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Failed to reset prompt',
                promptType: opportunityType
            });
        }
        setSaving(null);
    };

    const getTypeLabel = (type: string) => {
        return opportunityTypes.find(t => t.value === type)?.label || type;
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
                        Each prompt is independent and only one custom prompt per type is allowed.
                        Click "Edit" to modify a prompt, then "Save" to apply your changes.
                    </p>
                </div>
            </div>

            {/* Global Message */}
            {message && !message.promptType && (
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

            {/* Available Variables Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Available Variables for Custom Prompts</h3>
                <div className="text-xs text-slate-700 space-y-1">
                    <p><code className="bg-slate-200 px-1 py-0.5 rounded">[matched_content]</code> - Full scraped content (title + URL + content)</p>
                    <p><code className="bg-slate-200 px-1 py-0.5 rounded">[original_title]</code> - Original RSS item title</p>
                    <p className="text-slate-500 mt-2 italic">The AI must return valid JSON with: valid, title, excerpt, content, deadline, prize_value, requirements, location, confidence_score</p>
                </div>
            </div>

            {/* Prompts List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {prompts.map((promptConfig) => (
                        <div
                            key={promptConfig.opportunity_type}
                            className="border border-slate-200 rounded-lg p-4 space-y-3"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-slate-900">
                                            {getTypeLabel(promptConfig.opportunity_type)}
                                        </h4>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                            promptConfig.source === 'custom'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {promptConfig.source === 'custom' ? 'Custom' : 'Default'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {promptConfig.isEditing
                                            ? 'Editing prompt - Make your changes and click Save'
                                            : `${promptConfig.prompt.length} characters`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => toggleEdit(promptConfig.opportunity_type)}
                                    className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                                        promptConfig.isEditing
                                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                >
                                    {promptConfig.isEditing ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            {/* Message for this specific prompt */}
                            {message && message.promptType === promptConfig.opportunity_type && (
                                <div
                                    className={`p-3 rounded-lg flex items-start gap-2 ${
                                        message.type === 'success'
                                            ? 'bg-green-50 border border-green-200'
                                            : 'bg-red-50 border border-red-200'
                                    }`}
                                >
                                    {message.type === 'success' ? (
                                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <p className={`text-sm ${
                                        message.type === 'success' ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                        {message.text}
                                    </p>
                                </div>
                            )}

                            {/* Prompt Editor */}
                            {promptConfig.isEditing && (
                                <div className="space-y-2">
                                    <textarea
                                        value={promptConfig.prompt}
                                        onChange={(e) => handlePromptChange(promptConfig.opportunity_type, e.target.value)}
                                        rows={15}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your custom prompt here..."
                                    />

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSave(promptConfig.opportunity_type)}
                                            disabled={saving === promptConfig.opportunity_type}
                                            className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {saving === promptConfig.opportunity_type ? (
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
                                        {promptConfig.source === 'custom' && (
                                            <button
                                                onClick={() => handleReset(promptConfig.opportunity_type)}
                                                disabled={saving === promptConfig.opportunity_type}
                                                className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                                Reset to Default
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Preview (when not editing) */}
                            {!promptConfig.isEditing && (
                                <div className="bg-slate-50 rounded p-3 text-xs font-mono text-slate-700 max-h-32 overflow-y-auto">
                                    {promptConfig.prompt.substring(0, 300)}
                                    {promptConfig.prompt.length > 300 && '...'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
