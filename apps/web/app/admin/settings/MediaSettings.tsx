'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Search, Trash2, Copy, RefreshCw, Check, ExternalLink, Calendar, HardDrive } from 'lucide-react';

interface MediaFile {
    id: string;
    file_name: string;
    original_name: string;
    file_path: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    entity_type: string;
    created_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function MediaSettings() {
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 24, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchMedia();
    }, [pagination.page, search]);

    const fetchMedia = async () => {
        setLoading(true);
        setSessionExpired(false);
        try {
            const params = new URLSearchParams();
            params.set('page', pagination.page.toString());
            params.set('limit', pagination.limit.toString());
            if (search) params.set('search', search);

            const res = await fetch(`/api/admin/media?${params.toString()}`);

            if (res.status === 401) {
                setSessionExpired(true);
                setLoading(false);
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setMedia(data.media || []);
                setPagination(prev => ({ ...prev, ...data.pagination }));
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to load media' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load media' });
        }
        setLoading(false);
    };

    const handleUpload = async (files: FileList) => {
        setUploading(true);
        setMessage(null);

        let successCount = 0;
        let errorCount = 0;

        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) {
                errorCount++;
                continue;
            }

            if (file.size > 5 * 1024 * 1024) {
                errorCount++;
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/admin/media', {
                    method: 'POST',
                    body: formData,
                });

                if (res.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (err) {
                errorCount++;
            }
        }

        setUploading(false);

        if (successCount > 0) {
            setMessage({
                type: errorCount > 0 ? 'error' : 'success',
                text: `Uploaded ${successCount} image${successCount > 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
            });
            fetchMedia();
        } else if (errorCount > 0) {
            setMessage({ type: 'error', text: `Failed to upload ${errorCount} file${errorCount > 1 ? 's' : ''}` });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMedia(prev => prev.filter(m => m.id !== id));
                setSelectedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
                setMessage({ type: 'success', text: 'Image deleted successfully' });
            } else {
                setMessage({ type: 'error', text: 'Failed to delete image' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to delete image' });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} image${selectedIds.size > 1 ? 's' : ''}?`)) return;

        let successCount = 0;
        for (const id of selectedIds) {
            try {
                const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
                if (res.ok) successCount++;
            } catch (err) {
                // Continue deleting others
            }
        }

        setSelectedIds(new Set());
        setMessage({ type: 'success', text: `Deleted ${successCount} image${successCount > 1 ? 's' : ''}` });
        fetchMedia();
    };

    const copyUrl = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (sessionExpired) {
        return (
            <div className="text-center py-12 px-8 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-lg font-bold text-amber-800 mb-2">Session Expired</h3>
                <p className="text-amber-700 mb-4">Your session has expired. Please log in again.</p>
                <a href="/auth?redirect=/admin?section=settings" className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors">
                    Log In Again
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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

            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex items-center justify-center gap-3">
                        <RefreshCw size={24} className="animate-spin text-blue-600" />
                        <span className="text-slate-600 font-medium">Uploading...</span>
                    </div>
                ) : (
                    <>
                        <Upload size={32} className="mx-auto text-slate-400 mb-3" />
                        <p className="text-slate-600 font-medium mb-1">
                            Drag and drop images here
                        </p>
                        <p className="text-slate-400 text-sm mb-3">or</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                            Browse Files
                        </button>
                        <p className="text-slate-400 text-xs mt-3">
                            Max 5MB per file. Supports JPG, PNG, GIF, WebP
                        </p>
                    </>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        placeholder="Search images..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete ({selectedIds.size})
                        </button>
                    )}
                    <button
                        onClick={fetchMedia}
                        disabled={loading}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                    <ImageIcon size={14} />
                    {pagination.total} images
                </span>
            </div>

            {/* Media Grid */}
            {loading && media.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw size={24} className="animate-spin text-blue-600" />
                </div>
            ) : media.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No images found</p>
                    <p className="text-sm mt-1">Upload your first image to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {media.map((item) => (
                        <div
                            key={item.id}
                            className={`group relative bg-slate-100 rounded-xl overflow-hidden border-2 transition-all ${
                                selectedIds.has(item.id)
                                    ? 'border-blue-600 ring-2 ring-blue-200'
                                    : 'border-transparent hover:border-slate-300'
                            }`}
                        >
                            {/* Image */}
                            <div className="aspect-square">
                                <img
                                    src={item.file_url}
                                    alt={item.original_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Selection Checkbox */}
                            <button
                                onClick={() => toggleSelect(item.id)}
                                className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                    selectedIds.has(item.id)
                                        ? 'bg-blue-600 border-blue-600'
                                        : 'bg-white/80 border-slate-300 opacity-0 group-hover:opacity-100'
                                }`}
                            >
                                {selectedIds.has(item.id) && <Check size={14} className="text-white" />}
                            </button>

                            {/* Hover Actions */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => copyUrl(item.file_url, item.id)}
                                    className="p-1.5 bg-white rounded-md hover:bg-slate-100 transition-colors shadow-sm"
                                    title="Copy URL"
                                >
                                    {copiedId === item.id ? (
                                        <Check size={14} className="text-green-600" />
                                    ) : (
                                        <Copy size={14} className="text-slate-600" />
                                    )}
                                </button>
                                <a
                                    href={item.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-white rounded-md hover:bg-slate-100 transition-colors shadow-sm"
                                    title="Open in new tab"
                                >
                                    <ExternalLink size={14} className="text-slate-600" />
                                </a>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 bg-white rounded-md hover:bg-red-50 transition-colors shadow-sm"
                                    title="Delete"
                                >
                                    <Trash2 size={14} className="text-red-600" />
                                </button>
                            </div>

                            {/* File Info */}
                            <div className="p-2 bg-white border-t border-slate-100">
                                <p className="text-xs font-medium text-slate-700 truncate" title={item.original_name}>
                                    {item.original_name}
                                </p>
                                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                                    <span className="flex items-center gap-0.5">
                                        <HardDrive size={10} />
                                        {formatFileSize(item.file_size)}
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                        <Calendar size={10} />
                                        {formatDate(item.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page <= 1}
                        className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-500">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= pagination.totalPages}
                        className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
