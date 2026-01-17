'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegistrar - Registers the service worker on app load
 *
 * This ensures the SW is always registered, which is necessary for
 * receiving push notifications even when the app is closed.
 *
 * Note: This doesn't request notification permissions - that's handled
 * in /account/notifications when the user explicitly enables push.
 */
export default function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) {
            console.log('[SW-Registrar] Service workers not supported');
            return;
        }

        const registerServiceWorker = async () => {
            try {
                // Check if already registered
                const existingRegistration = await navigator.serviceWorker.getRegistration('/');

                if (existingRegistration) {
                    console.log('[SW-Registrar] Service worker already registered:', existingRegistration.scope);

                    // Check for updates
                    existingRegistration.update().catch(err => {
                        console.log('[SW-Registrar] Update check failed:', err);
                    });
                    return;
                }

                // Register new service worker
                console.log('[SW-Registrar] Registering service worker...');
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                });

                console.log('[SW-Registrar] Service worker registered successfully:', registration.scope);

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    console.log('[SW-Registrar] New service worker installing...');
                });
            } catch (error) {
                console.error('[SW-Registrar] Service worker registration failed:', error);
            }
        };

        // Register after page load to not block rendering
        if (document.readyState === 'complete') {
            registerServiceWorker();
        } else {
            window.addEventListener('load', registerServiceWorker);
            return () => window.removeEventListener('load', registerServiceWorker);
        }
    }, []);

    return null;
}
