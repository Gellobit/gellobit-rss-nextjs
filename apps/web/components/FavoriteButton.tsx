'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
    opportunityId: string;
    className?: string;
    size?: number;
    showLabel?: boolean;
}

export default function FavoriteButton({
    opportunityId,
    className = '',
    size = 20,
    showLabel = false,
}: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkFavoriteStatus();
    }, [opportunityId]);

    const checkFavoriteStatus = async () => {
        try {
            const res = await fetch(`/api/user/favorites/check?ids=${opportunityId}`);

            if (res.status === 401) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setIsFavorite(!!data.favorites[opportunityId]);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
        setLoading(false);
    };

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            // Redirect to login
            window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }

        // Optimistic update - change UI immediately
        const previousValue = isFavorite;
        setIsFavorite(!isFavorite);

        try {
            if (previousValue) {
                // Remove from favorites
                const res = await fetch(`/api/user/favorites?opportunity_id=${opportunityId}`, {
                    method: 'DELETE',
                });
                if (!res.ok) {
                    // Revert on error
                    setIsFavorite(previousValue);
                }
            } else {
                // Add to favorites
                const res = await fetch('/api/user/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ opportunity_id: opportunityId }),
                });
                if (!res.ok) {
                    // Revert on error
                    setIsFavorite(previousValue);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Revert on error
            setIsFavorite(previousValue);
        }
    };

    // Show skeleton while checking initial status
    if (loading) {
        return (
            <div className={`inline-flex items-center gap-2 ${className}`}>
                <Heart size={size} className="text-slate-200 animate-pulse" />
                {showLabel && <span className="text-sm text-slate-200">...</span>}
            </div>
        );
    }

    return (
        <button
            onClick={toggleFavorite}
            className={`inline-flex items-center gap-2 transition-all duration-150 ${
                isFavorite
                    ? 'text-red-500 hover:text-red-600 scale-100'
                    : 'text-slate-400 hover:text-red-500'
            } ${className}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart
                size={size}
                fill={isFavorite ? 'currentColor' : 'none'}
                className={`transition-transform duration-150 ${isFavorite ? 'scale-110' : 'scale-100'}`}
            />
            {showLabel && (
                <span className="text-sm font-medium">
                    {isFavorite ? 'Saved' : 'Save'}
                </span>
            )}
        </button>
    );
}
