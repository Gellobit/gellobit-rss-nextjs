'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, FolderOpen } from 'lucide-react';
import MediaModal from './MediaModal';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  entityType?: 'opportunity' | 'feed' | 'setting';
  entityId?: string;
  placeholder?: string;
  className?: string;
  showLibrary?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  entityType = 'setting',
  entityId,
  placeholder = 'Upload an image or paste URL',
  className = '',
  showLibrary = true
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url' | 'library'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('entityType', entityType);
      if (entityId) {
        formData.append('entityId', entityId);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setMode('upload');
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="w-32 h-20 object-cover rounded border border-slate-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" font-size="12" text-anchor="middle" fill="%2394a3b8">Error</text></svg>';
            }}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Upload/URL/Library Toggle */}
      {!value && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1 text-xs font-bold rounded ${
              mode === 'upload'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1 text-xs font-bold rounded ${
              mode === 'url'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Paste URL
          </button>
          {showLibrary && (
            <button
              type="button"
              onClick={() => setMediaModalOpen(true)}
              className="px-3 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1"
            >
              <FolderOpen size={12} />
              Library
            </button>
          )}
        </div>
      )}

      {/* Upload Mode */}
      {!value && mode === 'upload' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <ImageIcon className="mx-auto text-slate-400 mb-2" size={24} />
              <p className="text-sm text-slate-500">{placeholder}</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, GIF, WebP (max 5MB)</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* URL Mode */}
      {!value && mode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 border p-2 rounded text-sm"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
          >
            Use URL
          </button>
        </div>
      )}

      {/* Current URL display (when has value but want to show it) */}
      {value && (
        <input
          type="text"
          value={value}
          readOnly
          className="w-full border p-2 rounded text-xs text-slate-500 bg-slate-50"
        />
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Media Modal */}
      {showLibrary && (
        <MediaModal
          isOpen={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          onSelect={(url) => {
            onChange(url);
            setMediaModalOpen(false);
          }}
          title="Select Banner Image"
        />
      )}
    </div>
  );
}
