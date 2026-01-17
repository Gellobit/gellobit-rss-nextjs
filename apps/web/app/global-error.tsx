'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="text-center px-4">
                        <AlertTriangle className="mx-auto h-20 w-20 text-red-400 mb-6" />
                        <h1 className="text-3xl font-black text-slate-900 mb-2">
                            Critical Error
                        </h1>
                        <p className="text-slate-500 mb-6 max-w-md">
                            A critical error occurred. Please refresh the page.
                        </p>
                        <button
                            onClick={reset}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <RefreshCw size={18} />
                            Refresh Page
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
