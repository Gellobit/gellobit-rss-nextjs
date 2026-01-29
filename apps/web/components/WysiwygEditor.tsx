'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Link as LinkIcon,
    Image as ImageIcon,
    Undo,
    Redo,
    RemoveFormatting,
    Minus,
    X,
    Upload,
    Globe,
    Loader2,
    Code2,
    Table as TableIcon,
    Plus,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState, useRef } from 'react';

interface WysiwygEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    postId?: string; // Used to link uploaded images to the post
}

// Image Modal Component
function ImageModal({
    isOpen,
    onClose,
    onInsert,
    postId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (url: string, alt?: string) => void;
    postId?: string;
}) {
    const [tab, setTab] = useState<'upload' | 'url'>('upload');
    const [url, setUrl] = useState('');
    const [alt, setAlt] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (postId) {
                formData.append('postId', postId);
            }

            const response = await fetch('/api/admin/posts/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            onInsert(data.url, alt || file.name);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleUpload(file);
        }
    };

    const handleUrlSubmit = () => {
        if (url.trim()) {
            onInsert(url.trim(), alt || undefined);
            handleClose();
        }
    };

    const handleClose = () => {
        setUrl('');
        setAlt('');
        setError('');
        setTab('upload');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Insert Image</h3>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setTab('upload')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            tab === 'upload' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Upload size={16} className="inline mr-2" />
                        Upload
                    </button>
                    <button
                        onClick={() => setTab('url')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            tab === 'url' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Globe size={16} className="inline mr-2" />
                        URL
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {tab === 'upload' ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-yellow-400 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 size={32} className="text-yellow-500 animate-spin" />
                                    <p className="text-sm text-slate-500">Uploading...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className="mx-auto text-slate-400 mb-3" />
                                    <p className="text-sm text-slate-600 font-medium">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        PNG, JPG, GIF up to 5MB
                                    </p>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Image URL
                                </label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Alt Text (optional)
                                </label>
                                <input
                                    type="text"
                                    value={alt}
                                    onChange={e => setAlt(e.target.value)}
                                    placeholder="Describe the image"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={handleUrlSubmit}
                                disabled={!url.trim()}
                                className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Insert Image
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Link Modal Component
function LinkModal({
    isOpen,
    onClose,
    onInsert,
    initialUrl,
    initialTarget,
    initialRel,
}: {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (url: string, target: string, rel: string[]) => void;
    initialUrl?: string;
    initialTarget?: string;
    initialRel?: string;
}) {
    const [url, setUrl] = useState(initialUrl || '');
    const [target, setTarget] = useState(initialTarget || '_self');
    const [nofollow, setNofollow] = useState(false);
    const [sponsored, setSponsored] = useState(false);
    const [ugc, setUgc] = useState(false);

    useEffect(() => {
        setUrl(initialUrl || '');
        setTarget(initialTarget || '_self');
        // Parse initial rel
        const rels = (initialRel || '').split(' ').filter(Boolean);
        setNofollow(rels.includes('nofollow'));
        setSponsored(rels.includes('sponsored'));
        setUgc(rels.includes('ugc'));
    }, [initialUrl, initialTarget, initialRel, isOpen]);

    const handleSubmit = () => {
        if (!url.trim()) return;

        const relValues: string[] = [];
        if (nofollow) relValues.push('nofollow');
        if (sponsored) relValues.push('sponsored');
        if (ugc) relValues.push('ugc');
        if (target === '_blank') {
            relValues.push('noopener');
            relValues.push('noreferrer');
        }

        onInsert(url.trim(), target, relValues);
        handleClose();
    };

    const handleRemove = () => {
        onInsert('', '', []);
        handleClose();
    };

    const handleClose = () => {
        setUrl('');
        setTarget('_self');
        setNofollow(false);
        setSponsored(false);
        setUgc(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">
                        {initialUrl ? 'Edit Link' : 'Insert Link'}
                    </h3>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* URL */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Target */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Open in
                        </label>
                        <select
                            value={target}
                            onChange={e => setTarget(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        >
                            <option value="_self">Same window</option>
                            <option value="_blank">New tab</option>
                        </select>
                    </div>

                    {/* Rel Attributes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Link Attributes
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={nofollow}
                                    onChange={e => setNofollow(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
                                />
                                <span className="text-sm text-slate-600">
                                    <strong>nofollow</strong> - Tell search engines not to follow this link
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sponsored}
                                    onChange={e => setSponsored(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
                                />
                                <span className="text-sm text-slate-600">
                                    <strong>sponsored</strong> - Mark as paid/sponsored link
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ugc}
                                    onChange={e => setUgc(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
                                />
                                <span className="text-sm text-slate-600">
                                    <strong>ugc</strong> - Mark as user-generated content
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        {initialUrl && (
                            <button
                                onClick={handleRemove}
                                className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                            >
                                Remove Link
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={!url.trim()}
                            className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {initialUrl ? 'Update Link' : 'Insert Link'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Pretty print HTML for readability in editor
function formatHtml(html: string): string {
    if (!html) return '';

    let formatted = html;
    let indent = 0;
    const indentStr = '  ';

    // First, add newlines before and after tags
    formatted = formatted
        // Add newline before opening tags of block elements
        .replace(/<(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th|thead|tbody|figure|figcaption|section|article|header|footer|nav|aside)([^>]*)>/gi, '\n<$1$2>')
        // Add newline after closing tags of block elements
        .replace(/<\/(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th|thead|tbody|figure|figcaption|section|article|header|footer|nav|aside)>/gi, '</$1>\n')
        // Add newline after <br> and <hr>
        .replace(/<br\s*\/?>/gi, '<br>\n')
        .replace(/<hr\s*\/?>/gi, '<hr>\n')
        // Add newline after images
        .replace(/<img([^>]*)>/gi, '<img$1>\n');

    // Clean up multiple newlines and trim each line
    formatted = formatted
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');

    return formatted;
}

// Minify HTML (remove formatting for storage)
function minifyHtml(html: string): string {
    if (!html) return '';
    return html
        .split('\n')
        .map(line => line.trim())
        .join('')
        .replace(/>\s+</g, '><')
        .trim();
}

export default function WysiwygEditor({ value, onChange, placeholder = 'Start writing...', postId }: WysiwygEditorProps) {
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkModalData, setLinkModalData] = useState<{
        url?: string;
        target?: string;
        rel?: string;
    }>({});
    const [showHtml, setShowHtml] = useState(false);
    const [htmlContent, setHtmlContent] = useState(formatHtml(value));

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse border border-slate-200',
                },
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none min-h-[300px] p-4 focus:outline-none',
            },
        },
    });

    // Update content when value changes externally
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    const openLinkModal = useCallback(() => {
        if (!editor) return;

        const attrs = editor.getAttributes('link');
        setLinkModalData({
            url: attrs.href || '',
            target: attrs.target || '_self',
            rel: attrs.rel || '',
        });
        setLinkModalOpen(true);
    }, [editor]);

    const handleLinkInsert = useCallback((url: string, target: string, rel: string[]) => {
        if (!editor) return;

        if (!url) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({
                href: url,
                target: target || null,
                rel: rel.length > 0 ? rel.join(' ') : null,
            })
            .run();
    }, [editor]);

    const handleImageInsert = useCallback((url: string, alt?: string) => {
        if (!editor) return;
        editor.chain().focus().setImage({ src: url, alt: alt || '' }).run();
    }, [editor]);

    if (!editor) {
        return (
            <div className="border border-slate-200 rounded-lg bg-slate-50 min-h-[400px] flex items-center justify-center">
                <p className="text-slate-400">Loading editor...</p>
            </div>
        );
    }

    const ToolbarButton = ({
        onClick,
        isActive = false,
        disabled = false,
        children,
        title,
    }: {
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
            }`}
        >
            {children}
        </button>
    );

    const ToolbarDivider = () => <div className="w-px h-6 bg-slate-200 mx-1" />;

    return (
        <>
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                {/* Toolbar */}
                <div className="border-b border-slate-200 bg-slate-50 p-2 flex flex-wrap gap-1 items-center">
                    {/* Undo/Redo */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                    >
                        <Undo size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                    >
                        <Redo size={18} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Text Formatting */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        title="Underline (Ctrl+U)"
                    >
                        <UnderlineIcon size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        title="Strikethrough"
                    >
                        <Strikethrough size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        isActive={editor.isActive('code')}
                        title="Inline Code"
                    >
                        <Code size={18} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Headings */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    >
                        <Heading1 size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    >
                        <Heading2 size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive('heading', { level: 3 })}
                        title="Heading 3"
                    >
                        <Heading3 size={18} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Lists */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        title="Bullet List"
                    >
                        <List size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        title="Numbered List"
                    >
                        <ListOrdered size={18} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Block Elements */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        title="Quote"
                    >
                        <Quote size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                    >
                        <Minus size={18} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Link & Image */}
                    <ToolbarButton
                        onClick={openLinkModal}
                        isActive={editor.isActive('link')}
                        title="Insert Link"
                    >
                        <LinkIcon size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => setImageModalOpen(true)}
                        title="Insert Image"
                    >
                        <ImageIcon size={18} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Table Controls */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        isActive={editor.isActive('table')}
                        title="Insert Table (3x3)"
                    >
                        <TableIcon size={18} />
                    </ToolbarButton>
                    {editor.isActive('table') && (
                        <>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().addColumnAfter().run()}
                                title="Add Column"
                            >
                                <Plus size={14} />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().addRowAfter().run()}
                                title="Add Row"
                            >
                                <Plus size={14} className="rotate-90" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().deleteTable().run()}
                                title="Delete Table"
                            >
                                <Trash2 size={16} className="text-red-500" />
                            </ToolbarButton>
                        </>
                    )}

                    <ToolbarDivider />

                    {/* Clear Formatting */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                        title="Clear Formatting"
                    >
                        <RemoveFormatting size={18} />
                    </ToolbarButton>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* HTML Toggle */}
                    <ToolbarButton
                        onClick={() => {
                            if (showHtml) {
                                // Switching from HTML to Visual - apply changes (minified)
                                const minified = minifyHtml(htmlContent);
                                editor.commands.setContent(minified);
                                onChange(minified);
                            } else {
                                // Switching to HTML - get current content (formatted)
                                setHtmlContent(formatHtml(editor.getHTML()));
                            }
                            setShowHtml(!showHtml);
                        }}
                        isActive={showHtml}
                        title="Toggle HTML View"
                    >
                        <Code2 size={18} />
                    </ToolbarButton>
                </div>

                {/* Editor Content or HTML Editor */}
                {showHtml ? (
                    <textarea
                        value={htmlContent}
                        onChange={(e) => {
                            setHtmlContent(e.target.value);
                            // Save minified version
                            onChange(minifyHtml(e.target.value));
                        }}
                        className="w-full min-h-[300px] p-4 font-mono text-sm focus:outline-none resize-y bg-slate-50 text-slate-800"
                        placeholder="<p>Write HTML here...</p>"
                        spellCheck={false}
                    />
                ) : (
                    <EditorContent editor={editor} />
                )}

                {/* Character Count */}
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
                    <span>{editor.storage.characterCount?.characters?.() ?? editor.getText().length} characters</span>
                    <span className="text-slate-400">{showHtml ? 'HTML' : 'Visual'}</span>
                </div>
            </div>

            {/* Modals */}
            <ImageModal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                onInsert={handleImageInsert}
                postId={postId}
            />
            <LinkModal
                isOpen={linkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onInsert={handleLinkInsert}
                initialUrl={linkModalData.url}
                initialTarget={linkModalData.target}
                initialRel={linkModalData.rel}
            />
        </>
    );
}
