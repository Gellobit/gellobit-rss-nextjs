'use client';

import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export default function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check initial status
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowBanner(false);
            setDismissed(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
            setDismissed(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Don't show if online, dismissed, or banner hidden
    if (isOnline || !showBanner || dismissed) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
            <div className="bg-slate-900 text-white px-4 py-3 shadow-lg">
                <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500 p-2 rounded-full">
                            <WifiOff size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">No Internet Connection</p>
                            <p className="text-xs text-slate-300">Please check your connection and try again</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                        aria-label="Dismiss"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
