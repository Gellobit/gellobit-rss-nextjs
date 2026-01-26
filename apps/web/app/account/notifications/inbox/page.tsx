'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Gift, Calendar, Crown, Info, X, Briefcase, GraduationCap, Trophy, Settings, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    opportunity_id: string | null;
    metadata: Record<string, any>;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    expires_at: string | null;
    opportunities?: {
        id: string;
        title: string;
        slug: string;
        opportunity_type: string;
        featured_image_url: string | null;
    } | null;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    new_opportunity: <Gift size={18} className="text-yellow-600" />,
    favorite_expiring: <Calendar size={18} className="text-red-500" />,
    membership: <Crown size={18} className="text-purple-500" />,
    system: <Info size={18} className="text-blue-500" />,
};

const OPPORTUNITY_TYPE_ICONS: Record<string, React.ReactNode> = {
    giveaway: <Gift size={16} className="text-yellow-600" />,
    scholarship: <GraduationCap size={16} className="text-green-600" />,
    job_fair: <Briefcase size={16} className="text-blue-600" />,
    sweepstakes: <Trophy size={16} className="text-purple-600" />,
    contest: <Trophy size={16} className="text-orange-600" />,
    dream_job: <Briefcase size={16} className="text-indigo-600" />,
};

export default function NotificationsInboxPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 20;

    useEffect(() => {
        fetchNotifications(true);
    }, []);

    const fetchNotifications = async (reset = false) => {
        if (reset) {
            setLoading(true);
            setOffset(0);
        } else {
            setLoadingMore(true);
        }

        try {
            const currentOffset = reset ? 0 : offset;
            const res = await fetch(`/api/notifications?limit=${limit}&offset=${currentOffset}`);
            if (res.ok) {
                const data = await res.json();
                if (reset) {
                    setNotifications(data.notifications);
                } else {
                    setNotifications(prev => [...prev, ...data.notifications]);
                }
                setUnreadCount(data.unreadCount);
                setHasMore(data.notifications.length === limit);
                setOffset(currentOffset + data.notifications.length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }

        setLoading(false);
        setLoadingMore(false);
    };

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchNotifications(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PUT' });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/read-all', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            const wasUnread = notifications.find(n => n.id === id)?.is_read === false;
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const clearAllNotifications = async () => {
        if (!confirm('Clear all notifications? This cannot be undone.')) return;

        try {
            await fetch('/api/notifications/clear-all', { method: 'DELETE' });
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Error clearing all notifications:', error);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getNotificationLink = (notification: Notification): string | null => {
        if (notification.opportunity_id && notification.opportunities?.slug) {
            return `/opportunities/${notification.opportunities.slug}`;
        }
        if (notification.type === 'membership') {
            return '/account/membership';
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="flex items-center justify-between px-4 py-4">
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-slate-500">{unreadCount} unread</p>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                title="Mark all as read"
                            >
                                <CheckCheck size={20} />
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAllNotifications}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                title="Clear all notifications"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <Link
                            href="/account/notifications"
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full"
                            title="Notification settings"
                        >
                            <Settings size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Notification List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-slate-400" size={24} />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-16 px-4">
                    <Bell className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-medium">No notifications yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                        We&apos;ll notify you when there are new opportunities
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 bg-white">
                    {notifications.map((notification) => {
                        const link = getNotificationLink(notification);
                        const oppType = notification.metadata?.opportunity_type;

                        const content = (
                            <div
                                className={`px-4 py-4 flex gap-3 active:bg-slate-50 relative ${
                                    !notification.is_read ? 'bg-blue-50/50' : ''
                                }`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                                {/* Unread indicator */}
                                {!notification.is_read && (
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}

                                {/* Icon */}
                                <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                    {oppType && OPPORTUNITY_TYPE_ICONS[oppType]
                                        ? OPPORTUNITY_TYPE_ICONS[oppType]
                                        : TYPE_ICONS[notification.type] || <Bell size={18} className="text-slate-400" />
                                    }
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notification.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                        {notification.title}
                                    </p>
                                    {notification.message && (
                                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1.5">
                                        {formatTimeAgo(notification.created_at)}
                                    </p>
                                </div>

                                {/* Delete button */}
                                <button
                                    onClick={(e) => deleteNotification(notification.id, e)}
                                    className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 active:bg-red-50 rounded-full self-center"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        );

                        return link ? (
                            <Link key={notification.id} href={link}>
                                {content}
                            </Link>
                        ) : (
                            <div key={notification.id}>{content}</div>
                        );
                    })}

                    {/* Load More */}
                    {hasMore && (
                        <div className="p-4">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="w-full py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-200 disabled:opacity-50"
                            >
                                {loadingMore ? (
                                    <RefreshCw className="animate-spin mx-auto" size={18} />
                                ) : (
                                    'Load more'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
