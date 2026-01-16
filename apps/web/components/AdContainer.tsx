"use client";

import { AdUnit } from './AdUnit';

interface AdContainerProps {
    format?: 'horizontal' | 'rectangle' | 'auto';
    className?: string;
    position?: 'top' | 'middle' | 'bottom' | 'sidebar';
}

/**
 * AdContainer is a client-side wrapper for AdUnit
 * Use this in Server Components to insert ads
 */
export default function AdContainer({
    format = 'auto',
    className = '',
    position = 'middle'
}: AdContainerProps) {
    return (
        <div className={`ad-container ad-position-${position} ${className}`}>
            <AdUnit format={format} />
        </div>
    );
}
