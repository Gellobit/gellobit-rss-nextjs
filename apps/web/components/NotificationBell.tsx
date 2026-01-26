'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Gift, Calendar, Crown, Info, X, Briefcase, GraduationCap, Trophy, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

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
    new_opportunity: <Gift size={16} className="text-yellow-600" />,
    favorite_expiring: <Calendar size={16} className="text-red-500" />,
    membership: <Crown size={16} className="text-purple-500" />,
    system: <Info size={16} className="text-blue-500" />,
};

const OPPORTUNITY_TYPE_ICONS: Record<string, React.ReactNode> = {
    giveaway: <Gift size={14} className="text-yellow-600" />,
    scholarship: <GraduationCap size={14} className="text-green-600" />,
    job_fair: <Briefcase size={14} className="text-blue-600" />,
    sweepstakes: <Trophy size={14} className="text-purple-600" />,
};

export default function NotificationBell() {
    const { isAuthenticated } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch unread count on mount and periodically
    useEffect(() => {
        if (!isAuthenticated) return;

        fetchUnreadCount();

        // Poll for new notifications every 60 seconds
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await fetch('/api/notifications/count');
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications?limit=10');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
        setLoading(false);
    };

    const handleBellClick = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
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

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleBellClick}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">
                                <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="mx-auto text-slate-300 mb-2" size={32} />
                                <p className="text-slate-500 text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notification) => {
                                    const link = getNotificationLink(notification);
                                    const oppType = notification.metadata?.opportunity_type;

                                    const content = (
                                        <div
                                            className={`px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative group ${
                                                !notification.is_read ? 'bg-blue-50/50' : ''
                                            }`}
                                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                                        >
                                            {/* Icon */}
                                            <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                                {oppType && OPPORTUNITY_TYPE_ICONS[oppType]
                                                    ? OPPORTUNITY_TYPE_ICONS[oppType]
                                                    : TYPE_ICONS[notification.type] || <Bell size={16} className="text-slate-400" />
                                                }
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                    {notification.title}
                                                </p>
                                                {notification.message && (
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {formatTimeAgo(notification.created_at)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            markAsRead(notification.id);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => deleteNotification(notification.id, e)}
                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            {/* Unread indicator */}
                                            {!notification.is_read && (
                                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                            )}
                                        </div>
                                    );

                                    return link ? (
                                        <Link key={notification.id} href={link} onClick={() => setIsOpen(false)}>
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={notification.id}>{content}</div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                        <Link
                            href="/account/notifications"
                            onClick={() => setIsOpen(false)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Notification Settings
                        </Link>
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAllNotifications}
                                className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                                <Trash2 size={14} />
                                Clear all
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
