'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, RefreshCw, Pencil, Trash2, X, Check, GripVertical, Eye, EyeOff, Lock, Info } from 'lucide-react';

interface OpportunityType {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    is_active: boolean;
    is_system: boolean;
    display_order: number;
}

interface FormData {
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
}

const defaultFormData: FormData = {
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    icon: '',
};

const colorPresets = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E',
];

export default function OpportunityTypesSettings() {
    const [types, setTypes] = useState<OpportunityType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<FormData>(defaultFormData);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/opportunity-types?includeInactive=true');
            const data = await res.json();
            if (res.ok) {
                setTypes(data.types || []);
            } else {
                console.error('Error fetching types:', data.error);
            }
        } catch (error) {
            console.error('Error fetching types:', error);
        }
        setLoading(false);
    };

    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 50);
    };

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: prev.slug || generateSlug(name),
        }));
    };

    const handleAdd = async () => {
        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Name is required' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/opportunity-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Opportunity type created successfully!' });
                setFormData(defaultFormData);
                setShowAddForm(false);
                fetchTypes();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to create opportunity type' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to create opportunity type' });
        }
        setSaving(false);
    };

    const handleUpdate = async (id: string) => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/admin/opportunity-types/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Opportunity type updated successfully!' });
                setEditingId(null);
                setFormData(defaultFormData);
                fetchTypes();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update opportunity type' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update opportunity type' });
        }
        setSaving(false);
    };

    const handleDelete = async (id: string, name: string, isSystem: boolean) => {
        if (isSystem) {
            setMessage({ type: 'error', text: 'System types cannot be deleted. You can deactivate them instead.' });
            return;
        }

        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/opportunity-types/${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Opportunity type deleted successfully!' });
                fetchTypes();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to delete opportunity type' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete opportunity type' });
        }
    };

    const handleToggleActive = async (type: OpportunityType) => {
        try {
            const res = await fetch(`/api/admin/opportunity-types/${type.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !type.is_active }),
            });

            if (res.ok) {
                fetchTypes();
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to toggle status' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to toggle status' });
        }
    };

    const startEdit = (type: OpportunityType) => {
        setEditingId(type.id);
        setFormData({
            name: type.name,
            slug: type.slug,
            description: type.description || '',
            color: type.color,
            icon: type.icon || '',
        });
        setShowAddForm(false);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(defaultFormData);
    };

    return (
        <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-bold mb-1">Manage Opportunity Types</p>
                    <p className="text-blue-800">
                        Create and manage the types of opportunities that can be processed. System types (marked with a lock)
                        cannot be deleted but can be deactivated. Inactive types will not appear in dropdowns.
                    </p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Add Button */}
            {!showAddForm && !editingId && (
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setFormData(defaultFormData);
                    }}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2"
                >
                    <Plus size={16} /> Add Opportunity Type
                </button>
            )}

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">New Opportunity Type</h3>
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setFormData(defaultFormData);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Hackathon"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Slug</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="hackathon"
                            />
                            <p className="text-xs text-slate-400 mt-1">Lowercase letters, numbers, and underscores only</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Brief description of this opportunity type"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 mb-2">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {colorPresets.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        formData.color === color
                                            ? 'border-slate-900 scale-110'
                                            : 'border-transparent hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                className="w-8 h-8 rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleAdd}
                            disabled={saving}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Creating...' : 'Create Type'}
                        </button>
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setFormData(defaultFormData);
                            }}
                            className="px-4 py-2 border border-slate-300 rounded-lg font-bold hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Types List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw size={24} className="animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-500">Loading opportunity types...</span>
                </div>
            ) : types.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    No opportunity types found. Add your first type above.
                </div>
            ) : (
                <div className="space-y-2">
                    {types.map((type) => (
                        <div
                            key={type.id}
                            className={`border rounded-lg p-4 transition-colors ${
                                editingId === type.id
                                    ? 'border-blue-300 bg-blue-50'
                                    : type.is_active
                                        ? 'border-slate-200 bg-white'
                                        : 'border-slate-200 bg-slate-50 opacity-60'
                            }`}
                        >
                            {editingId === type.id ? (
                                /* Edit Form */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Slug (read-only)</label>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                disabled
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono bg-slate-100 text-slate-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Description</label>
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-slate-500 mb-2">Color</label>
                                        <div className="flex flex-wrap gap-2">
                                            {colorPresets.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                                        formData.color === color
                                                            ? 'border-slate-900 scale-110'
                                                            : 'border-transparent hover:scale-105'
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                            <input
                                                type="color"
                                                value={formData.color}
                                                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                                className="w-8 h-8 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdate(type.id)}
                                            disabled={saving}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="px-4 py-2 border border-slate-300 rounded-lg font-bold hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Display View */
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <GripVertical size={16} className="text-slate-300" />
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: type.color }}
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{type.name}</span>
                                                <span className="text-xs text-slate-400 font-mono">({type.slug})</span>
                                                {type.is_system && (
                                                    <span title="System type">
                                                        <Lock size={12} className="text-slate-400" />
                                                    </span>
                                                )}
                                                {!type.is_active && (
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded">
                                                        INACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            {type.description && (
                                                <p className="text-xs text-slate-500">{type.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleToggleActive(type)}
                                            className={`p-2 rounded transition-colors ${
                                                type.is_active
                                                    ? 'text-green-600 hover:bg-green-50'
                                                    : 'text-slate-400 hover:bg-slate-100'
                                            }`}
                                            title={type.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            {type.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        <button
                                            onClick={() => startEdit(type)}
                                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        {!type.is_system && (
                                            <button
                                                onClick={() => handleDelete(type.id, type.name, type.is_system)}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
