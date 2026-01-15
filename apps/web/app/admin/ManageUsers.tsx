'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    RefreshCw,
    Trash2,
    Shield,
    ShieldOff,
    UserCheck,
    UserX,
    Filter,
    ChevronLeft,
    ChevronRight,
    Pencil,
    X,
    Save,
    Crown,
    User as UserIcon
} from 'lucide-react';

interface User {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
    role: 'admin' | 'user';
    status: 'active' | 'suspended' | null;
    membership_type: 'free' | 'basic' | 'premium' | 'lifetime' | null;
    membership_expires_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Stats {
    total: number;
    admins: number;
    users: number;
    active: number;
    suspended: number;
    free: number;
    premium: number;
}

export default function ManageUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);

    // Filters
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [membershipFilter, setMembershipFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 20;

    // Edit modal
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        role: 'user' as 'admin' | 'user',
        status: 'active' as 'active' | 'suspended',
        membership_type: 'free' as 'free' | 'basic' | 'premium' | 'lifetime'
    });
    const [saving, setSaving] = useState(false);

    // Stats
    const [stats, setStats] = useState<Stats>({
        total: 0,
        admins: 0,
        users: 0,
        active: 0,
        suspended: 0,
        free: 0,
        premium: 0
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter, statusFilter, membershipFilter]);

    const fetchUsers = async () => {
        setRefreshing(true);
        setSessionExpired(false);
        try {
            const params = new URLSearchParams();
            params.append('limit', limit.toString());
            params.append('offset', ((page - 1) * limit).toString());
            if (roleFilter) params.append('role', roleFilter);
            if (statusFilter) params.append('status', statusFilter);
            if (membershipFilter) params.append('membership', membershipFilter);
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`/api/admin/users?${params.toString()}`);

            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setUsers(data.users || []);
                setTotalCount(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / limit));
                setStats(data.stats || {
                    total: 0, admins: 0, users: 0, active: 0, suspended: 0, free: 0, premium: 0
                });
            } else {
                console.error('Error fetching users:', data.error);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleSearch = () => {
        setPage(1);
        fetchUsers();
    };

    const handleStatusChange = async (id: string, newStatus: 'active' | 'suspended') => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert('Error updating status: ' + data.error);
            }
        } catch (error) {
            alert('Error updating status: ' + error);
        }
    };

    const handleRoleChange = async (id: string, newRole: 'admin' | 'user') => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert('Error updating role: ' + data.error);
            }
        } catch (error) {
            alert('Error updating role: ' + error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone and will remove all user data.')) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert('Error deleting user: ' + data.error);
            }
        } catch (error) {
            alert('Error deleting user: ' + error);
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditForm({
            role: user.role || 'user',
            status: user.status || 'active',
            membership_type: user.membership_type || 'free'
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                setEditingUser(null);
                fetchUsers();
            } else {
                const data = await res.json();
                alert('Error updating user: ' + data.error);
            }
        } catch (error) {
            alert('Error updating user: ' + error);
        }
        setSaving(false);
    };

    const getRoleBadge = (role: string) => {
        if (role === 'admin') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    <Shield size={12} />
                    Admin
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                <UserIcon size={12} />
                User
            </span>
        );
    };

    const getStatusBadge = (status: string | null) => {
        if (status === 'suspended') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    <UserX size={12} />
                    Suspended
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                <UserCheck size={12} />
                Active
            </span>
        );
    };

    const getMembershipBadge = (type: string | null) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            free: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Free' },
            basic: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Basic' },
            premium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Premium' },
            lifetime: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Lifetime' },
        };
        const badge = badges[type || 'free'] || badges.free;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                {type === 'premium' || type === 'lifetime' ? <Crown size={12} /> : null}
                {badge.label}
            </span>
        );
    };

    if (sessionExpired) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center py-12 px-8 bg-amber-50 border border-amber-200 rounded-lg max-w-md">
                    <div className="text-amber-600 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Session Expired</h3>
                    <p className="text-amber-700 mb-4">Your session has expired. Please log in again to continue.</p>
                    <a
                        href="/auth?redirect=/admin?section=users"
                        className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors"
                    >
                        Log In Again
                    </a>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-[#1a1a1a]">Users</h1>
                <button
                    onClick={() => fetchUsers()}
                    disabled={refreshing}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div
                    className={`bg-white p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-colors ${roleFilter === '' && statusFilter === '' ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => { setRoleFilter(''); setStatusFilter(''); setPage(1); }}
                >
                    <div className="text-2xl font-black text-slate-900">{stats.total}</div>
                    <div className="text-sm font-bold text-slate-500">Total Users</div>
                </div>
                <div
                    className={`bg-white p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-colors ${roleFilter === 'admin' ? 'border-purple-500' : 'border-slate-200 hover:border-purple-200'}`}
                    onClick={() => { setRoleFilter('admin'); setStatusFilter(''); setPage(1); }}
                >
                    <div className="text-2xl font-black text-purple-600">{stats.admins}</div>
                    <div className="text-sm font-bold text-slate-500">Admins</div>
                </div>
                <div
                    className={`bg-white p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-colors ${statusFilter === 'active' ? 'border-green-500' : 'border-slate-200 hover:border-green-200'}`}
                    onClick={() => { setStatusFilter('active'); setRoleFilter(''); setPage(1); }}
                >
                    <div className="text-2xl font-black text-green-600">{stats.active}</div>
                    <div className="text-sm font-bold text-slate-500">Active</div>
                </div>
                <div
                    className={`bg-white p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-colors ${statusFilter === 'suspended' ? 'border-red-500' : 'border-slate-200 hover:border-red-200'}`}
                    onClick={() => { setStatusFilter('suspended'); setRoleFilter(''); setPage(1); }}
                >
                    <div className="text-2xl font-black text-red-600">{stats.suspended}</div>
                    <div className="text-sm font-bold text-slate-500">Suspended</div>
                </div>
                <div
                    className={`bg-white p-4 rounded-xl shadow-sm border-2 cursor-pointer transition-colors ${membershipFilter === 'premium' ? 'border-amber-500' : 'border-slate-200 hover:border-amber-200'}`}
                    onClick={() => { setMembershipFilter(membershipFilter === 'premium' ? '' : 'premium'); setPage(1); }}
                >
                    <div className="text-2xl font-black text-amber-600">{stats.premium}</div>
                    <div className="text-sm font-bold text-slate-500">Premium</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </select>

                    <select
                        value={membershipFilter}
                        onChange={(e) => { setMembershipFilter(e.target.value); setPage(1); }}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    >
                        <option value="">All Memberships</option>
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                        <option value="lifetime">Lifetime</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />

                    <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
                    >
                        <Filter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Results Info */}
            <div className="text-sm text-slate-600 font-bold">
                Showing {users.length} of {totalCount} users
                {roleFilter && ` (${roleFilter}s)`}
                {statusFilter && ` (${statusFilter})`}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">User</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Role</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Membership</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Registered</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt={user.display_name || 'User'}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                        <UserIcon size={20} className="text-slate-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-slate-900">
                                                        {user.display_name || 'No name'}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {user.email || 'No email'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getMembershipBadge(user.membership_type)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                {/* Toggle role */}
                                                {user.role === 'user' ? (
                                                    <button
                                                        onClick={() => handleRoleChange(user.id, 'admin')}
                                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                        title="Make Admin"
                                                    >
                                                        <Shield size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRoleChange(user.id, 'user')}
                                                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                                        title="Remove Admin"
                                                    >
                                                        <ShieldOff size={16} />
                                                    </button>
                                                )}
                                                {/* Toggle status */}
                                                {user.status !== 'suspended' ? (
                                                    <button
                                                        onClick={() => handleStatusChange(user.id, 'suspended')}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Suspend User"
                                                    >
                                                        <UserX size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStatusChange(user.id, 'active')}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="Activate User"
                                                    >
                                                        <UserCheck size={16} />
                                                    </button>
                                                )}
                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="px-4 py-2 font-bold text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Edit User</h3>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* User info */}
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                {editingUser.avatar_url ? (
                                    <img
                                        src={editingUser.avatar_url}
                                        alt={editingUser.display_name || 'User'}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                        <UserIcon size={24} className="text-slate-500" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-slate-900">
                                        {editingUser.display_name || 'No name'}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        {editingUser.email || 'No email'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'user' })}
                                    className="border border-slate-200 p-2 rounded-lg w-full font-bold"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'suspended' })}
                                    className="border border-slate-200 p-2 rounded-lg w-full font-bold"
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Membership</label>
                                <select
                                    value={editForm.membership_type}
                                    onChange={(e) => setEditForm({ ...editForm, membership_type: e.target.value as 'free' | 'basic' | 'premium' | 'lifetime' })}
                                    className="border border-slate-200 p-2 rounded-lg w-full font-bold"
                                >
                                    <option value="free">Free</option>
                                    <option value="basic">Basic</option>
                                    <option value="premium">Premium</option>
                                    <option value="lifetime">Lifetime</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 justify-center disabled:opacity-50"
                                >
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
