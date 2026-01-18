"use client";

import React, { useState } from 'react';
import { Share2, Check, Link as LinkIcon, X } from 'lucide-react';

interface ShareButtonProps {
    title: string;
    url?: string;
    className?: string;
}

export default function ShareButton({ title, url, className = '' }: ShareButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    const handleShare = async () => {
        // Try native share first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // User cancelled or error, fall through to modal
                if ((err as Error).name === 'AbortError') return;
            }
        }

        // Show modal with share options
        setShowModal(true);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareToTwitter = () => {
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=550,height=420'
        );
        setShowModal(false);
    };

    const shareToFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=550,height=420'
        );
        setShowModal(false);
    };

    const shareToLinkedIn = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=550,height=420'
        );
        setShowModal(false);
    };

    const shareToWhatsApp = () => {
        window.open(
            `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`,
            '_blank'
        );
        setShowModal(false);
    };

    return (
        <>
            <button
                onClick={handleShare}
                className={`p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ${className}`}
                aria-label="Share"
            >
                <Share2 size={18} />
            </button>

            {/* Share Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
                    <div
                        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Share</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Social Share Buttons */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            <button
                                onClick={shareToTwitter}
                                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                                    X
                                </div>
                                <span className="text-xs text-slate-600">Twitter</span>
                            </button>
                            <button
                                onClick={shareToFacebook}
                                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                    f
                                </div>
                                <span className="text-xs text-slate-600">Facebook</span>
                            </button>
                            <button
                                onClick={shareToLinkedIn}
                                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                                    in
                                </div>
                                <span className="text-xs text-slate-600">LinkedIn</span>
                            </button>
                            <button
                                onClick={shareToWhatsApp}
                                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                                    W
                                </div>
                                <span className="text-xs text-slate-600">WhatsApp</span>
                            </button>
                        </div>

                        {/* Copy Link */}
                        <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700 transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check size={18} className="text-green-600" />
                                    <span className="text-green-600">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <LinkIcon size={18} />
                                    <span>Copy link</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
