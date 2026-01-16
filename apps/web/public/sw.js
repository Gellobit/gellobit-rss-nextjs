// Service Worker for Push Notifications
// This file must be served from the root of the domain
// Version: 1.1

const CACHE_NAME = 'gellobit-v1';
const SW_VERSION = '1.1';

// Install event
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker version:', SW_VERSION);
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[SW] Service worker activated, version:', SW_VERSION);
    event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push event received!');
    console.log('[SW] Has data:', !!event.data);

    let data = {
        title: 'Gellobit',
        body: 'New notification',
        url: '/',
    };

    try {
        if (event.data) {
            const text = event.data.text();
            console.log('[SW] Raw push data:', text);

            // Try to parse as JSON, otherwise use as body text
            try {
                const payload = JSON.parse(text);
                console.log('[SW] Parsed JSON payload:', payload);
                data = {
                    title: payload.title || data.title,
                    body: payload.body || data.body,
                    icon: payload.icon,
                    badge: payload.badge,
                    url: payload.url || data.url,
                    tag: payload.tag,
                    data: payload.data || {},
                };
            } catch (jsonError) {
                // Not JSON, use raw text as body
                console.log('[SW] Using raw text as body');
                data.body = text;
            }
        }
    } catch (e) {
        console.error('[SW] Error processing push data:', e);
    }

    console.log('[SW] Showing notification:', data.title, '-', data.body);

    const options = {
        body: data.body,
        tag: data.tag || 'gellobit-notification',
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
            url: data.url,
            ...data.data,
        },
    };

    // Only add icon/badge if they exist
    if (data.icon) options.icon = data.icon;
    if (data.badge) options.badge = data.badge;

    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('[SW] Notification shown successfully'))
            .catch(err => console.error('[SW] Error showing notification:', err))
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(urlToOpen);
                        return;
                    }
                }
                // Open new window if none found
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed');
});
