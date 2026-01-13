'use client';

import { useState, useRef } from 'react';
import { Download, Upload, FileJson, Check, AlertCircle } from 'lucide-react';

export default function FeedsSettings() {
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setExporting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/feeds/export');

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Export failed');
            }

            // Get the JSON data
            const data = await res.json();

            // Create and download file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `feeds-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: `Exported ${data.feeds_count} feeds successfully` });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Export failed' });
        }

        setExporting(false);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setMessage(null);

        try {
            const text = await file.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch {
                throw new Error('Invalid JSON file');
            }

            const res = await fetch('/api/admin/feeds/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Import failed');
            }

            setMessage({
                type: 'success',
                text: `Imported ${result.imported} feeds${result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : ''}`
            });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Import failed' });
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setImporting(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileJson size={20} /> Export / Import Feeds
            </h3>

            <p className="text-sm text-slate-600 mb-6">
                Export your RSS feeds configuration to a JSON file for backup or migration.
                Import feeds from a previously exported file.
            </p>

            <div className="flex flex-wrap gap-4">
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                    <Download size={18} />
                    {exporting ? 'Exporting...' : 'Export Feeds'}
                </button>

                <button
                    onClick={handleImportClick}
                    disabled={importing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <Upload size={18} />
                    {importing ? 'Importing...' : 'Import Feeds'}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-bold text-sm mb-2">Export includes:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Feed name, URL, and opportunity type</li>
                    <li>• Status and processing settings</li>
                    <li>• AI provider configuration (per feed)</li>
                    <li>• Quality threshold, priority, and cron interval</li>
                    <li>• Fallback image URL and republishing settings</li>
                </ul>
                <p className="text-xs text-slate-400 mt-3">
                    Note: API keys are not exported for security reasons.
                </p>
            </div>
        </div>
    );
}
