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

        setLoading(true);

        try {
            if (isFavorite) {
                // Remove from favorites
                const res = await fetch(`/api/user/favorites?opportunity_id=${opportunityId}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    setIsFavorite(false);
                }
            } else {
                // Add to favorites
                const res = await fetch('/api/user/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ opportunity_id: opportunityId }),
                });
                if (res.ok) {
                    setIsFavorite(true);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }

        setLoading(false);
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={loading}
            className={`inline-flex items-center gap-2 transition-colors ${
                isFavorite
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-slate-400 hover:text-red-500'
            } ${loading ? 'opacity-50' : ''} ${className}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart
                size={size}
                fill={isFavorite ? 'currentColor' : 'none'}
                className={loading ? 'animate-pulse' : ''}
            />
            {showLabel && (
                <span className="text-sm font-medium">
                    {isFavorite ? 'Saved' : 'Save'}
                </span>
            )}
        </button>
    );
}
