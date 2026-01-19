'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Star, StarOff, GripVertical, RefreshCw } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    display_order: number;
    is_active: boolean;
    is_default: boolean;
    post_count?: number;
}

interface CategoryFormData {
    name: string;
    slug: string;
    description: string;
    color: string;
    is_active: boolean;
}

const defaultFormData: CategoryFormData = {
    name: '',
    slug: '',
    description: '',
    color: '#FFDE59',
    is_active: true,
};

const colorOptions = [
    { value: '#FFDE59', label: 'Yellow' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Orange' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#EF4444', label: 'Red' },
    { value: '#14B8A6', label: 'Teal' },
    { value: '#64748B', label: 'Slate' },
];

export default function CategoriesSettings() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();
            if (data.categories) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setMessage({ type: 'error', text: 'Failed to load categories' });
        }
        setLoading(false);
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: editingId ? prev.slug : generateSlug(name),
        }));
    };

    const startEdit = (category: Category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            color: category.color,
            is_active: category.is_active,
        });
        setIsCreating(false);
    };

    const startCreate = () => {
        setIsCreating(true);
        setEditingId(null);
        setFormData(defaultFormData);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData(defaultFormData);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.slug.trim()) {
            setMessage({ type: 'error', text: 'Name and slug are required' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const url = editingId
                ? `/api/admin/categories/${editingId}`
                : '/api/admin/categories';

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: editingId ? 'Category updated!' : 'Category created!' });
                fetchCategories();
                cancelEdit();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save category' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save category' });
        }
        setSaving(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete category "${name}"? Posts in this category will become uncategorized.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Category deleted!' });
                fetchCategories();
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to delete category' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete category' });
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/categories/${id}/default`, {
                method: 'POST',
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Default category updated!' });
                fetchCategories();
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to set default' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to set default category' });
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus }),
            });

            if (res.ok) {
                fetchCategories();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update category' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Blog Categories</h2>
                    <p className="text-sm text-slate-500">Manage categories for your blog posts</p>
                </div>
                <button
                    onClick={startCreate}
                    disabled={isCreating}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                    <Plus size={16} />
                    Add Category
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

            {/* Create Form */}
            {isCreating && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <h3 className="font-bold text-blue-900">New Category</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Category name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Slug *</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="category-slug"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={2}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Brief description for SEO"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                                            formData.color === color.value
                                                ? 'border-slate-900 scale-110'
                                                : 'border-transparent hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active_new"
                                checked={formData.is_active}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                className="w-4 h-4 rounded border-slate-300"
                            />
                            <label htmlFor="is_active_new" className="text-sm font-bold text-slate-700">Active</label>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Category'}
                        </button>
                        <button
                            onClick={cancelEdit}
                            className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300 flex items-center gap-2"
                        >
                            <X size={16} />
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Categories List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                    <p className="text-slate-500">No categories yet. Create your first category!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className={`border rounded-lg p-4 transition-colors ${
                                category.is_active
                                    ? 'bg-white border-slate-200'
                                    : 'bg-slate-50 border-slate-200 opacity-60'
                            }`}
                        >
                            {editingId === category.id ? (
                                /* Edit Mode */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Slug</label>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                rows={2}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Color</label>
                                            <div className="flex flex-wrap gap-2">
                                                {colorOptions.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                                                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                                                            formData.color === color.value
                                                                ? 'border-slate-900 scale-110'
                                                                : 'border-transparent hover:scale-105'
                                                        }`}
                                                        style={{ backgroundColor: color.value }}
                                                        title={color.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                            Save
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300 flex items-center gap-2"
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: category.color }}
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900">{category.name}</h4>
                                                {category.is_default && (
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full flex items-center gap-1">
                                                        <Star size={10} fill="currentColor" />
                                                        Default
                                                    </span>
                                                )}
                                                {!category.is_active && (
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                                <span>/{category.slug}/</span>
                                                {category.description && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate max-w-xs">{category.description}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!category.is_default && (
                                            <button
                                                onClick={() => handleSetDefault(category.id)}
                                                className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                title="Set as default"
                                            >
                                                <StarOff size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleToggleActive(category.id, category.is_active)}
                                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                                                category.is_active
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                            }`}
                                        >
                                            {category.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                        <button
                                            onClick={() => startEdit(category)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id, category.name)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
                <p><strong>Default category:</strong> Used when creating new blog posts or when a feed doesn't specify a category.</p>
                <p className="mt-1"><strong>Inactive categories:</strong> Won't appear in category selection but existing posts keep their category.</p>
            </div>
        </div>
    );
}
