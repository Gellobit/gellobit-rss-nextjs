'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Image as ImageIcon, Search, Check, Trash2, Copy, RefreshCw, FolderOpen } from 'lucide-react';

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

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    title?: string;
}

export default function MediaModal({ isOpen, onClose, onSelect, title = 'Select Image' }: MediaModalProps) {
    const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            params.set('limit', '100');

            const res = await fetch(`/api/admin/media?${params.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setMedia(data.media || []);
            } else {
                setError(data.error || 'Failed to load media');
            }
        } catch (err) {
            setError('Failed to load media');
        }
        setLoading(false);
    }, [search]);

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
            setSelectedId(null);
        }
    }, [isOpen, fetchMedia]);

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/media', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.media) {
                // Add new media to the beginning of the list
                setMedia(prev => [data.media, ...prev]);
                setSelectedId(data.media.id);
                setActiveTab('library');
            } else {
                setError(data.error || 'Failed to upload');
            }
        } catch (err) {
            setError('Failed to upload');
        }

        setUploading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleSelect = () => {
        const selected = media.find(m => m.id === selectedId);
        if (selected) {
            onSelect(selected.file_url);
            onClose();
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMedia(prev => prev.filter(m => m.id !== id));
                if (selectedId === id) setSelectedId(null);
            }
        } catch (err) {
            setError('Failed to delete');
        }
    };

    const copyUrl = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors ${
                            activeTab === 'library'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FolderOpen size={16} />
                        Media Library
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors ${
                            activeTab === 'upload'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Upload size={16} />
                        Upload New
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'library' && (
                        <>
                            {/* Search */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative flex-1">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search images..."
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={fetchMedia}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw size={18} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {/* Media Grid */}
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw size={24} className="animate-spin text-blue-600" />
                                </div>
                            ) : media.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                                    <p>No images found</p>
                                    <button
                                        onClick={() => setActiveTab('upload')}
                                        className="mt-3 text-blue-600 font-bold text-sm hover:underline"
                                    >
                                        Upload your first image
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {media.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedId(item.id)}
                                            className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                                                selectedId === item.id
                                                    ? 'border-blue-600 ring-2 ring-blue-200'
                                                    : 'border-transparent hover:border-slate-300'
                                            }`}
                                        >
                                            <img
                                                src={item.file_url}
                                                alt={item.original_name}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Selection indicator */}
                                            {selectedId === item.id && (
                                                <div className="absolute top-2 left-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <Check size={14} className="text-white" />
                                                </div>
                                            )}

                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                <button
                                                    onClick={(e) => copyUrl(item.file_url, e)}
                                                    className="p-2 bg-white rounded-lg hover:bg-slate-100 transition-colors"
                                                    title="Copy URL"
                                                >
                                                    <Copy size={16} className="text-slate-700" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(item.id, e)}
                                                    className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </button>
                                            </div>

                                            {/* File info */}
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                                <p className="text-white text-xs truncate font-medium">
                                                    {item.original_name}
                                                </p>
                                                <p className="text-white/70 text-[10px]">
                                                    {formatFileSize(item.file_size)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'upload' && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                                dragOver
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-300 hover:border-slate-400'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <RefreshCw size={48} className="animate-spin text-blue-600 mb-4" />
                                    <p className="text-slate-600 font-medium">Uploading...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                                    <p className="text-slate-600 font-medium mb-2">
                                        Drag and drop an image here
                                    </p>
                                    <p className="text-slate-400 text-sm mb-4">or</p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        Browse Files
                                    </button>
                                    <p className="text-slate-400 text-xs mt-4">
                                        Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <p className="text-sm text-slate-500">
                        {media.length} images in library
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSelect}
                            disabled={!selectedId}
                            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Select Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
