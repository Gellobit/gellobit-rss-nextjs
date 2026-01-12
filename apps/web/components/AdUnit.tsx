"use client";

import React from 'react';
import { useSubscription } from '../context/SubscriptionContext';

interface AdUnitProps {
    slotId?: string;
    format?: 'horizontal' | 'rectangle';
    className?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotId, format = 'horizontal', className = '' }) => {
    const { isPro } = useSubscription();

    if (isPro) {
        return null; // Don't render ads for Pro users
    }

    // Placeholder styles for development
    const baseStyles = "bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest";
    const dimStyles = format === 'horizontal' ? 'w-full h-24' : 'w-[300px] h-[250px]';

    return (
        <div className={`my-8 ${className}`}>
            <div className={`${baseStyles} ${dimStyles} relative overflow-hidden group`}>
                <span className="relative z-10">Ad Space</span>
                <div className="absolute inset-0 bg-stripes opacity-10"></div>
                {/* In production, this would inject the Google AdSense script */}
                {slotId && <div data-ad-slot={slotId} className="hidden" />}
            </div>
            <div className="text-center mt-2">
                <button className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">
                    Remove ads with Pro
                </button>
            </div>
        </div>
    );
};
