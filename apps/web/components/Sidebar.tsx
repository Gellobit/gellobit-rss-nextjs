'use client';

import React from 'react';
import { Calendar, User, Tag, Clock, ExternalLink } from 'lucide-react';
import AdUnit from './AdUnit';

export interface SidebarAuthor {
    name: string;
    imageUrl?: string;
    description?: string;
    link?: string;
}

export interface SidebarRelatedItem {
    title: string;
    slug: string;
    imageUrl?: string;
    date?: string;
}

export interface SidebarProps {
    // Ad configuration
    showAd?: boolean;
    adPosition?: 'top' | 'middle' | 'bottom';
    adSlotId?: string;

    // Author section
    author?: SidebarAuthor;

    // Metadata section
    publishedDate?: string;
    readingTime?: string;
    category?: string;
    tags?: string[];

    // Related items
    relatedItems?: SidebarRelatedItem[];
    relatedTitle?: string;

    // Custom content
    children?: React.ReactNode;

    // Styling
    className?: string;
    sticky?: boolean;
}

export default function Sidebar({
    showAd = true,
    adPosition = 'top',
    adSlotId,
    author,
    publishedDate,
    readingTime,
    category,
    tags,
    relatedItems,
    relatedTitle = 'Related Posts',
    children,
    className = '',
    sticky = true,
}: SidebarProps) {
    const formattedDate = publishedDate
        ? new Date(publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : null;

    const AdSection = () => (
        showAd ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 text-center">
                    Sponsored
                </div>
                <AdUnit format="rectangle" slotId={adSlotId} className="!my-0" />
            </div>
        ) : null
    );

    return (
        <aside className={`hidden lg:block w-80 flex-shrink-0 ${className}`}>
            <div className={`space-y-6 ${sticky ? 'sticky top-24' : ''}`}>
                {/* Ad at top position */}
                {adPosition === 'top' && <AdSection />}

                {/* Author Section */}
                {author && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-start gap-4">
                            {author.imageUrl ? (
                                <img
                                    src={author.imageUrl}
                                    alt={author.name}
                                    className="w-12 h-12 rounded-full object-cover bg-slate-100"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-[#FFDE59] rounded-full flex items-center justify-center">
                                    <User size={20} className="text-slate-800" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                {author.link ? (
                                    <a href={author.link} className="font-bold text-slate-900 hover:text-[#FFDE59] transition-colors">
                                        {author.name}
                                    </a>
                                ) : (
                                    <div className="font-bold text-slate-900">{author.name}</div>
                                )}
                                {author.description && (
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                        {author.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Metadata Section */}
                {(formattedDate || readingTime || category) && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
                            Details
                        </h3>
                        <div className="space-y-3">
                            {formattedDate && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                                    <span>{formattedDate}</span>
                                </div>
                            )}
                            {readingTime && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Clock size={16} className="text-slate-400 flex-shrink-0" />
                                    <span>{readingTime}</span>
                                </div>
                            )}
                            {category && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Tag size={16} className="text-slate-400 flex-shrink-0" />
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">
                                        {category}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tags Section */}
                {tags && tags.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
                            Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ad at middle position */}
                {adPosition === 'middle' && <AdSection />}

                {/* Related Items Section */}
                {relatedItems && relatedItems.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
                            {relatedTitle}
                        </h3>
                        <div className="space-y-4">
                            {relatedItems.slice(0, 5).map((item, index) => (
                                <a
                                    key={index}
                                    href={`/${item.slug}`}
                                    className="group flex gap-3 items-start"
                                >
                                    {item.imageUrl && (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-16 h-12 object-cover rounded-lg flex-shrink-0 bg-slate-100"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-slate-900 group-hover:text-[#FFDE59] transition-colors line-clamp-2">
                                            {item.title}
                                        </h4>
                                        {item.date && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(item.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom Content */}
                {children}

                {/* Ad at bottom position */}
                {adPosition === 'bottom' && <AdSection />}
            </div>
        </aside>
    );
}

// Sidebar widget components for custom content
export function SidebarWidget({
    title,
    children,
    className = ''
}: {
    title?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
            {title && (
                <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
                    {title}
                </h3>
            )}
            {children}
        </div>
    );
}

export function SidebarCTA({
    title,
    description,
    buttonText,
    buttonLink,
    variant = 'primary'
}: {
    title: string;
    description?: string;
    buttonText: string;
    buttonLink: string;
    variant?: 'primary' | 'secondary';
}) {
    const isPrimary = variant === 'primary';

    return (
        <div className={`rounded-xl p-5 ${isPrimary ? 'bg-[#FFDE59]' : 'bg-slate-100 border border-slate-200'}`}>
            <h3 className={`font-bold mb-2 ${isPrimary ? 'text-slate-900' : 'text-slate-900'}`}>
                {title}
            </h3>
            {description && (
                <p className={`text-sm mb-4 ${isPrimary ? 'text-slate-700' : 'text-slate-600'}`}>
                    {description}
                </p>
            )}
            <a
                href={buttonLink}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    isPrimary
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
            >
                {buttonText}
                <ExternalLink size={14} />
            </a>
        </div>
    );
}
