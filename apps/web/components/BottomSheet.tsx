'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    snapPoints?: number[]; // Percentage heights [0.5, 0.9] means 50% and 90%
}

export default function BottomSheet({
    isOpen,
    onClose,
    title,
    children,
    snapPoints = [0.6], // Default to 60% height
}: BottomSheetProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [sheetHeight, setSheetHeight] = useState(0);
    const sheetRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const maxHeight = typeof window !== 'undefined' ? window.innerHeight * snapPoints[snapPoints.length - 1] : 500;
    const minHeight = typeof window !== 'undefined' ? window.innerHeight * 0.2 : 100;

    useEffect(() => {
        if (isOpen) {
            setSheetHeight(maxHeight);
            document.body.style.overflow = 'hidden';
        } else {
            setSheetHeight(0);
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, maxHeight]);

    const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setIsDragging(true);
        setStartY(clientY);
        setCurrentY(clientY);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;

        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const delta = clientY - startY;
        setCurrentY(clientY);

        // Only allow dragging down (positive delta)
        if (delta > 0) {
            const newHeight = Math.max(minHeight, maxHeight - delta);
            setSheetHeight(newHeight);
        }
    }, [isDragging, startY, maxHeight, minHeight]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        const delta = currentY - startY;
        const threshold = maxHeight * 0.3; // 30% threshold to close

        if (delta > threshold) {
            onClose();
        } else {
            // Snap back to max height
            setSheetHeight(maxHeight);
        }
    }, [isDragging, currentY, startY, maxHeight, onClose]);

    // Handle click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 transition-opacity flex items-end md:items-center md:justify-center"
            onClick={handleBackdropClick}
        >
            <div
                ref={sheetRef}
                className="w-full md:max-w-xl md:mx-4 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl transition-transform duration-200 ease-out"
                style={{
                    height: sheetHeight,
                    transform: `translateY(${isOpen ? 0 : '100%'})`,
                    maxHeight: '90vh',
                }}
            >
                {/* Drag Handle */}
                <div
                    className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseMove={handleTouchMove}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={() => isDragging && handleTouchEnd()}
                >
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div
                    ref={contentRef}
                    className="overflow-y-auto overscroll-contain"
                    style={{ height: title ? 'calc(100% - 80px)' : 'calc(100% - 40px)' }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
