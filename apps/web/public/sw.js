// Service Worker for Push Notifications
// This file must be served from the root of the domain
// Version: 1.2

const CACHE_NAME = 'gellobit-v1';
const SW_VERSION = '1.2';

// Log helper that also stores logs for debugging
const logs = [];
const log = (...args) => {
    const message = `[SW v${SW_VERSION}] ${args.join(' ')}`;
    console.log(message);
    logs.push({ time: new Date().toISOString(), message });
    // Keep only last 50 logs
    if (logs.length > 50) logs.shift();
};

// Install event
self.addEventListener('install', (event) => {
    log('Installing service worker');
    // Force activation without waiting for other tabs
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    log('Service worker activated');
    // Take control of all clients immediately
    event.waitUntil(
        self.clients.claim().then(() => {
            log('Claimed all clients');
        })
    );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    log('=== PUSH EVENT RECEIVED ===');
    log('Has data:', !!event.data);

    let data = {
        title: 'Gellobit',
        body: 'New notification',
        url: '/',
    };

    try {
        if (event.data) {
            const text = event.data.text();
            log('Raw push data:', text.substring(0, 200));

            // Try to parse as JSON, otherwise use as body text
            try {
                const payload = JSON.parse(text);
                log('Parsed JSON payload - title:', payload.title, 'body:', payload.body?.substring(0, 50));
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
                log('Using raw text as body (not JSON)');
                data.body = text;
            }
        }
    } catch (e) {
        log('Error processing push data:', e.message);
    }

    log('Preparing notification - title:', data.title, 'body:', data.body);

    const options = {
        body: data.body,
        tag: data.tag || 'gellobit-notification',
        renotify: true,
        requireInteraction: false, // Changed to false - some browsers have issues with true
        vibrate: [200, 100, 200],
        data: {
            url: data.url,
            ...data.data,
        },
    };

    // Only add icon/badge if they exist
    if (data.icon) options.icon = data.icon;
    if (data.badge) options.badge = data.badge;

    log('Calling showNotification with options');

    const notificationPromise = self.registration.showNotification(data.title, options)
        .then(() => {
            log('=== NOTIFICATION SHOWN SUCCESSFULLY ===');
        })
        .catch(err => {
            log('ERROR showing notification:', err.message, err.stack);
        });

    // Important: We must keep the SW alive until notification is shown
    event.waitUntil(notificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    log('Notification clicked, action:', event.action);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';
    log('Opening URL:', urlToOpen);

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        log('Found existing window, focusing and navigating');
                        client.focus();
                        client.navigate(urlToOpen);
                        return;
                    }
                }
                // Open new window if none found
                if (self.clients.openWindow) {
                    log('Opening new window');
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    log('Notification closed');
});

// Message handler - for debugging from the main page
self.addEventListener('message', (event) => {
    log('Received message:', event.data?.type);

    if (event.data?.type === 'GET_VERSION') {
        event.ports[0]?.postMessage({ version: SW_VERSION });
    }

    if (event.data?.type === 'GET_LOGS') {
        event.ports[0]?.postMessage({ logs });
    }

    if (event.data?.type === 'TEST_NOTIFICATION') {
        log('Test notification requested via message');
        self.registration.showNotification('Test from SW', {
            body: 'This notification was triggered via postMessage',
            tag: 'test-direct',
        }).then(() => {
            log('Test notification shown');
        }).catch(err => {
            log('Test notification error:', err.message);
        });
    }

    if (event.data?.type === 'PING') {
        event.ports[0]?.postMessage({ pong: true, version: SW_VERSION });
    }
});

// Fetch event - minimal implementation, mainly for debugging
self.addEventListener('fetch', (event) => {
    // Only log API calls to avoid spam
    if (event.request.url.includes('/api/')) {
        // Don't log, just pass through
    }
    // Let all requests pass through to network
});

log('Service worker script loaded');
