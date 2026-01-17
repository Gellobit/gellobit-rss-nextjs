'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Send, Bell } from 'lucide-react';

interface SwStatus {
    registered: boolean;
    state: string | null;
    scope: string | null;
    version: string | null;
    pushSubscription: boolean;
    permissionStatus: string;
    isSecureContext: boolean;
}

interface SwLog {
    time: string;
    message: string;
}

export default function PushTestPage() {
    const [mounted, setMounted] = useState(false);
    const [swStatus, setSwStatus] = useState<SwStatus | null>(null);
    const [logs, setLogs] = useState<SwLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const checkStatus = useCallback(async () => {
        if (typeof window === 'undefined') return;

        setLoading(true);

        const isSecureContext = window.isSecureContext;

        if (!('serviceWorker' in navigator)) {
            setSwStatus({
                registered: false,
                state: 'unsupported',
                scope: null,
                version: null,
                pushSubscription: false,
                permissionStatus: 'unsupported',
                isSecureContext,
            });
            setLoading(false);
            return;
        }

        try {
            const registration = await navigator.serviceWorker.getRegistration('/');
            const permission = 'Notification' in window ? Notification.permission : 'unsupported';
            let pushSub = false;
            let version = null;

            if (registration) {
                try {
                    const sub = await registration.pushManager.getSubscription();
                    pushSub = !!sub;
                } catch (e) {
                    console.error('Error checking push subscription:', e);
                }

                if (registration.active) {
                    try {
                        const messageChannel = new MessageChannel();
                        const versionPromise = new Promise<string | null>((resolve) => {
                            messageChannel.port1.onmessage = (event) => {
                                resolve(event.data?.version || null);
                            };
                            setTimeout(() => resolve(null), 1000);
                        });
                        registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
                        version = await versionPromise;
                    } catch (e) {
                        console.error('Error getting SW version:', e);
                    }
                }
            }

            setSwStatus({
                registered: !!registration,
                state: registration?.active ? 'active' : registration?.installing ? 'installing' : registration?.waiting ? 'waiting' : null,
                scope: registration?.scope || null,
                version,
                pushSubscription: pushSub,
                permissionStatus: permission,
                isSecureContext,
            });
        } catch (error) {
            console.error('Error checking SW status:', error);
        }

        setLoading(false);
    }, []);

    const getSwLogs = useCallback(async () => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.getRegistration('/');
            if (registration?.active) {
                const messageChannel = new MessageChannel();
                const logsPromise = new Promise<SwLog[]>((resolve) => {
                    messageChannel.port1.onmessage = (event) => {
                        resolve(event.data?.logs || []);
                    };
                    setTimeout(() => resolve([]), 1000);
                });
                registration.active.postMessage({ type: 'GET_LOGS' }, [messageChannel.port2]);
                const swLogs = await logsPromise;
                setLogs(swLogs);
            }
        } catch (error) {
            console.error('Error getting SW logs:', error);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        checkStatus();
        const interval = setInterval(getSwLogs, 2000);
        return () => clearInterval(interval);
    }, [checkStatus, getSwLogs]);

    const testLocalNotification = async () => {
        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setMessage({ type: 'error', text: 'Permission denied' });
                return;
            }
        }

        try {
            const registration = await navigator.serviceWorker.getRegistration('/');
            if (!registration) {
                setMessage({ type: 'error', text: 'No SW registration found' });
                return;
            }

            console.log('[Push Test] Calling showNotification...');
            await registration.showNotification('Local Test via SW', {
                body: 'This notification was shown via SW registration. Time: ' + new Date().toLocaleTimeString(),
                tag: 'test-local-sw-' + Date.now(),
                requireInteraction: false,
            });
            console.log('[Push Test] showNotification completed without error');
            setMessage({
                type: 'success',
                text: 'Notification sent! Check your system notifications.',
            });
        } catch (error) {
            console.error('[Push Test] showNotification error:', error);
            setMessage({ type: 'error', text: `Error: ${error}` });
        }
    };

    const testSwNotification = async () => {
        try {
            const registration = await navigator.serviceWorker.getRegistration('/');
            if (!registration?.active) {
                setMessage({ type: 'error', text: 'Service worker not active' });
                return;
            }

            registration.active.postMessage({ type: 'TEST_NOTIFICATION' });
            setMessage({ type: 'info', text: 'Test notification requested from SW' });
        } catch (error) {
            setMessage({ type: 'error', text: `Error: ${error}` });
        }
    };

    const testServerPush = async () => {
        setSending(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/settings/push/test', {
                method: 'POST',
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({
                    type: 'success',
                    text: `Push sent! Sent: ${data.sent}, Failed: ${data.failed}. Check your notifications!`,
                });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to send' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: `Error: ${error}` });
        }

        setSending(false);
    };

    const registerSw = async () => {
        try {
            setMessage({ type: 'info', text: 'Registering service worker...' });
            await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;
            setMessage({ type: 'success', text: 'Service worker registered' });
            checkStatus();
        } catch (error) {
            setMessage({ type: 'error', text: `Registration failed: ${error}` });
        }
    };

    const unregisterSw = async () => {
        try {
            const registration = await navigator.serviceWorker.getRegistration('/');
            if (registration) {
                await registration.unregister();
                setMessage({ type: 'success', text: 'Service worker unregistered' });
                checkStatus();
            }
        } catch (error) {
            setMessage({ type: 'error', text: `Unregister failed: ${error}` });
        }
    };

    const requestPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setMessage({ type: 'info', text: `Permission: ${permission}` });
            checkStatus();
        } catch (error) {
            setMessage({ type: 'error', text: `Error: ${error}` });
        }
    };

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-slate-400" size={24} />
                </div>
            </div>
        );
    }

    const StatusIcon = ({ ok }: { ok: boolean | null }) => {
        if (ok === null) return <AlertCircle className="text-amber-500" size={20} />;
        return ok ? <CheckCircle className="text-green-500" size={20} /> : <XCircle className="text-red-500" size={20} />;
    };

    const swSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Push Notifications Debug</h1>
                    <p className="text-slate-500 text-sm">Test and diagnose push notification issues</p>
                </div>
                <button
                    onClick={() => { checkStatus(); getSwLogs(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${
                    message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 font-bold">Status Check</div>
                <div className="divide-y divide-slate-100">
                    <div className="p-4 flex items-center justify-between">
                        <span>Service Worker Supported</span>
                        <StatusIcon ok={swSupported} />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <span>Service Worker Registered</span>
                        <div className="flex items-center gap-2">
                            <StatusIcon ok={swStatus?.registered ?? null} />
                            {swStatus?.state && <span className="text-sm text-slate-500">({swStatus.state})</span>}
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <span>SW Version</span>
                        <span className="text-sm font-mono">{swStatus?.version || 'unknown'}</span>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <span>SW Scope</span>
                        <span className="text-sm font-mono truncate max-w-[200px]">{swStatus?.scope || 'N/A'}</span>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <span>Notification Permission</span>
                        <div className="flex items-center gap-2">
                            <StatusIcon ok={swStatus?.permissionStatus === 'granted'} />
                            <span className="text-sm">{swStatus?.permissionStatus || 'checking...'}</span>
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <span>Push Subscription Active</span>
                        <StatusIcon ok={swStatus?.pushSubscription ?? null} />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <span>Secure Context (HTTPS/localhost)</span>
                        <StatusIcon ok={swStatus?.isSecureContext ?? null} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 font-bold">Actions</div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button
                        onClick={registerSw}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                        Register SW
                    </button>
                    <button
                        onClick={unregisterSw}
                        className="px-4 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300"
                    >
                        Unregister SW
                    </button>
                    <button
                        onClick={requestPermission}
                        className="px-4 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
                    >
                        Request Permission
                    </button>
                    <button
                        onClick={testLocalNotification}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        <Bell size={16} />
                        Local Notification
                    </button>
                    <button
                        onClick={testSwNotification}
                        className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                        <Bell size={16} />
                        SW Notification
                    </button>
                    <button
                        onClick={testServerPush}
                        disabled={sending}
                        className="px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Send size={16} />
                        {sending ? 'Sending...' : 'Server Push'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold">Service Worker Logs</span>
                    <button
                        onClick={getSwLogs}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Refresh
                    </button>
                </div>
                <div className="p-4 max-h-96 overflow-auto">
                    {logs.length === 0 ? (
                        <p className="text-slate-500 text-sm">No logs yet. Logs appear when the SW processes events.</p>
                    ) : (
                        <div className="space-y-1 font-mono text-xs">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-slate-400 whitespace-nowrap">
                                        {new Date(log.time).toLocaleTimeString()}
                                    </span>
                                    <span className={log.message.includes('ERROR') ? 'text-red-600' : 'text-slate-700'}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-bold text-green-800 mb-2">Testing Steps:</h3>
                <ol className="list-decimal list-inside text-sm text-green-700 space-y-1">
                    <li>Verify all status checks are green above</li>
                    <li>Click &quot;Local Notification&quot; - should show immediately</li>
                    <li>Click &quot;SW Notification&quot; - also immediate</li>
                    <li>Click &quot;Server Push&quot; - tests the full end-to-end flow</li>
                    <li>Check SW Logs for any errors</li>
                </ol>
            </div>
        </div>
    );
}
