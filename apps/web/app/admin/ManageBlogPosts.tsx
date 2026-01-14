'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Eye,
    Search,
    RefreshCw,
    Save,
    X,
    Image as ImageIcon,
    ExternalLink,
    FileText,
    Globe,
    Clock,
    FolderOpen,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import MediaModal from '@/components/MediaModal';

// Dynamic import to avoid SSR issues with TipTap
const WysiwygEditor = dynamic(() => import('@/components/WysiwygEditor'), {
    ssr: false,
    loading: () => (
        <div className="border border-slate-200 rounded-lg bg-slate-50 min-h-[400px] flex items-center justify-center">
            <p className="text-slate-400">Loading editor...</p>
        </div>
    ),
});

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featured_image_url: string | null;
    meta_title: string | null;
    meta_description: string | null;
    status: 'draft' | 'published' | 'archived';
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

interface PostFormData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image_url: string;
    meta_title: string;
    meta_description: string;
    status: 'draft' | 'published' | 'archived';
}

const initialFormData: PostFormData = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    meta_title: '',
    meta_description: '',
    status: 'draft',
};

export default function ManageBlogPosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [total, setTotal] = useState(0);
    const [sessionExpired, setSessionExpired] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [formData, setFormData] = useState<PostFormData>(initialFormData);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Media modal state
    const [mediaModalOpen, setMediaModalOpen] = useState(false);

    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchPosts();
    }, [statusFilter, searchQuery]);

    const fetchPosts = async () => {
        setLoading(true);
        setSessionExpired(false);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/admin/posts?${params.toString()}`);

            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setPosts(data.posts || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
        setLoading(false);
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleTitleChange = (title: string) => {
        setFormData(prev => ({
            ...prev,
            title,
            slug: prev.slug || generateSlug(title),
        }));
    };

    const handleMediaSelect = (url: string) => {
        setFormData(prev => ({ ...prev, featured_image_url: url }));
        setMediaModalOpen(false);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.slug || !formData.content) {
            setMessage({ type: 'error', text: 'Title, slug, and content are required' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const url = editingPost
                ? `/api/admin/posts/${editingPost.id}`
                : '/api/admin/posts';

            const method = editingPost ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: editingPost ? 'Post updated!' : 'Post created!' });
                setShowForm(false);
                setEditingPost(null);
                setFormData(initialFormData);
                fetchPosts();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save post' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save post' });
        }

        setSaving(false);
    };

    const handleEdit = (post: Post) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || '',
            content: post.content,
            featured_image_url: post.featured_image_url || '',
            meta_title: post.meta_title || '',
            meta_description: post.meta_description || '',
            status: post.status,
        });
        setShowForm(true);
        setMessage(null);
    };

    const handleDelete = async (post: Post) => {
        if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;

        try {
            const res = await fetch(`/api/admin/posts/${post.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchPosts();
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleNewPost = () => {
        setEditingPost(null);
        setFormData(initialFormData);
        setShowForm(true);
        setMessage(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Published</span>;
            case 'draft':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">Draft</span>;
            case 'archived':
                return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">Archived</span>;
            default:
                return null;
        }
    };

    if (showForm) {
        return (
            <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-[#1a1a1a]">
                        {editingPost ? 'Edit Post' : 'New Post'}
                    </h1>
                    <button
                        onClick={() => {
                            setShowForm(false);
                            setEditingPost(null);
                            setFormData(initialFormData);
                        }}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Enter post title..."
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Slug */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Slug *
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-sm">/</span>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    placeholder="post-slug"
                                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Excerpt
                            </label>
                            <textarea
                                value={formData.excerpt}
                                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                placeholder="Brief description for SEO and previews..."
                                rows={3}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                Content *
                            </label>
                            <p className="text-xs text-slate-500 mb-3">
                                Use the toolbar to format text with headings, bold, lists, links, and more.
                            </p>
                            <WysiwygEditor
                                value={formData.content}
                                onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                                placeholder="Start writing your post content..."
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publish Box */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <h3 className="font-bold text-lg mb-4">Publish</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {editingPost ? 'Update Post' : 'Save Post'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <h3 className="font-bold text-lg mb-4">Featured Image</h3>

                            {formData.featured_image_url ? (
                                <div className="space-y-3">
                                    <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                                        <img
                                            src={formData.featured_image_url}
                                            alt="Featured"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, featured_image_url: '' }))}
                                        className="text-red-600 text-sm font-bold hover:text-red-700"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="aspect-video bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                                        <ImageIcon className="text-slate-400" size={32} />
                                    </div>
                                    <button
                                        onClick={() => setMediaModalOpen(true)}
                                        className="w-full bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FolderOpen size={16} />
                                        Select Image
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* SEO */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <h3 className="font-bold text-lg mb-4">SEO</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.meta_title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                                        placeholder="SEO title (optional)"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Meta Description
                                    </label>
                                    <textarea
                                        value={formData.meta_description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                                        placeholder="SEO description (optional)"
                                        rows={3}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Modal */}
            <MediaModal
                isOpen={mediaModalOpen}
                onClose={() => setMediaModalOpen(false)}
                onSelect={handleMediaSelect}
                title="Select Featured Image"
            />
            </>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1a1a1a]">Blog Posts</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage public evergreen content
                    </p>
                </div>
                <button
                    onClick={handleNewPost}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    New Post
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search posts..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>

                    {/* Refresh */}
                    <button
                        onClick={fetchPosts}
                        className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="text-sm text-slate-500">
                Showing {posts.length} of {total} posts
            </div>

            {/* Posts List */}
            {sessionExpired ? (
                <div className="text-center py-12 px-8 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-600 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Session Expired</h3>
                    <p className="text-amber-700 mb-4">Your session has expired. Please log in again to continue.</p>
                    <a
                        href="/auth?redirect=/admin?section=blog"
                        className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors"
                    >
                        Log In Again
                    </a>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">No posts yet</h3>
                    <p className="text-slate-500 mb-6">Create your first blog post to get started.</p>
                    <button
                        onClick={handleNewPost}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Create Post
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Post</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                                <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-4">
                                            {post.featured_image_url ? (
                                                <img
                                                    src={post.featured_image_url}
                                                    alt=""
                                                    className="w-16 h-12 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-16 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                                    <ImageIcon className="text-slate-400" size={16} />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-slate-900">{post.title}</h3>
                                                <p className="text-sm text-slate-500">/{post.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(post.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-500">
                                            {post.published_at ? (
                                                <div className="flex items-center gap-1">
                                                    <Globe size={12} />
                                                    {new Date(post.published_at).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {new Date(post.created_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {post.status === 'published' && (
                                                <a
                                                    href={`/${post.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post)}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
