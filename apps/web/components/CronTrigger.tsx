'use client';

import { useEffect } from 'react';

/**
 * CronTrigger Component
 *
 * Lightweight component that triggers visitor-based cron on page load.
 * Uses sessionStorage to prevent multiple triggers per session.
 *
 * Features:
 * - Non-blocking: Uses fire-and-forget fetch
 * - Session debounce: Only triggers once per browser session
 * - Silent: No UI, no errors shown to users
 *
 * The server-side endpoint has its own debounce logic (minimum interval),
 * so even if this fires multiple times, the server will handle it.
 */
export default function CronTrigger() {
    useEffect(() => {
        // Check if we've already triggered in this session
        const sessionKey = 'cron_triggered';
        const alreadyTriggered = sessionStorage.getItem(sessionKey);

        if (alreadyTriggered) {
            return; // Already triggered this session
        }

        // Mark as triggered for this session
        sessionStorage.setItem(sessionKey, Date.now().toString());

        // Fire-and-forget: Don't await, don't handle response
        // The server handles all the logic (debounce, processing, etc.)
        fetch('/api/cron/check-and-run', {
            method: 'POST',
            // Use keepalive to ensure request completes even if user navigates away
            keepalive: true,
        }).catch(() => {
            // Silently ignore errors - cron is not critical for user experience
        });
    }, []);

    // This component renders nothing
    return null;
}
