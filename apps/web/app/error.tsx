'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center px-4">
                <AlertTriangle className="mx-auto h-20 w-20 text-amber-400 mb-6" />
                <h1 className="text-3xl font-black text-[#1a1a1a] mb-2">
                    Something went wrong
                </h1>
                <p className="text-slate-500 mb-6 max-w-md">
                    An unexpected error occurred. Please try again.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        <Home size={18} />
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
}
