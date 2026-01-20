'use client';

import React, { useMemo, useState, useEffect } from 'react';
import LazyAdUnit from './LazyAdUnit';

interface ContentWithAdsProps {
    content: string;
    className?: string;
    // Ad configuration
    showAds?: boolean;
    adFormat?: 'horizontal' | 'rectangle' | 'auto';
    // Slot IDs for different positions (optional - will use default if not provided)
    adSlotAfterFirst?: string;
    adSlotMiddle?: string;
    adSlotBottom?: string;
    // Control which ad positions to show
    showAdAfterFirst?: boolean;
    showAdMiddle?: boolean;
    showAdBottom?: boolean;
    // Minimum content requirements
    minParagraphsForMiddleAd?: number; // Minimum paragraphs needed to show middle ad
}

interface ContentBlock {
    type: 'html' | 'ad';
    content?: string;
    adPosition?: string;
    adSlotId?: string;
}

export default function ContentWithAds({
    content,
    className = '',
    showAds = true,
    adFormat = 'horizontal',
    adSlotAfterFirst,
    adSlotMiddle,
    adSlotBottom,
    showAdAfterFirst = true,
    showAdMiddle = true,
    showAdBottom = true,
    minParagraphsForMiddleAd = 6,
}: ContentWithAdsProps) {
    // Track if we're on the client side
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Parse content and determine ad insertion points
    const contentBlocks = useMemo(() => {
        if (!showAds) {
            return [{ type: 'html' as const, content }];
        }

        // IMPORTANT: Wait until client-side to parse content for ads
        // This prevents hydration mismatch between server and client
        if (!isClient) {
            return [{ type: 'html' as const, content }];
        }

        const blocks: ContentBlock[] = [];

        // Parse HTML to find block elements (only on client side)
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
        const container = doc.body.firstChild as HTMLElement;

        if (!container) {
            return [{ type: 'html' as const, content }];
        }

        const children = Array.from(container.children);

        // Count significant block elements (paragraphs, headings, lists, etc.)
        const blockElements = children.filter(el =>
            ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'BLOCKQUOTE', 'PRE', 'DIV', 'FIGURE'].includes(el.tagName)
        );

        const totalBlocks = blockElements.length;

        // Find insertion points
        let afterFirstInsertIndex = -1;
        let middleInsertIndex = -1;

        // Find position after first subtitle or first paragraph
        if (showAdAfterFirst) {
            // Look for first h2 or h3
            const firstSubtitleIndex = children.findIndex(el =>
                el.tagName === 'H2' || el.tagName === 'H3'
            );

            if (firstSubtitleIndex !== -1 && firstSubtitleIndex < children.length - 1) {
                // Insert after the element following the subtitle (usually content under that heading)
                // Find the next block element after the subtitle
                let nextBlockAfterSubtitle = -1;
                for (let i = firstSubtitleIndex + 1; i < children.length; i++) {
                    if (['P', 'UL', 'OL', 'BLOCKQUOTE', 'PRE', 'DIV', 'FIGURE'].includes(children[i].tagName)) {
                        nextBlockAfterSubtitle = i;
                        break;
                    }
                }
                afterFirstInsertIndex = nextBlockAfterSubtitle !== -1 ? nextBlockAfterSubtitle + 1 : firstSubtitleIndex + 1;
            } else {
                // No subtitle found, insert after first paragraph
                const firstParagraphIndex = children.findIndex(el => el.tagName === 'P');
                if (firstParagraphIndex !== -1) {
                    afterFirstInsertIndex = firstParagraphIndex + 1;
                }
            }
        }

        // Find middle position
        if (showAdMiddle && totalBlocks >= minParagraphsForMiddleAd) {
            // Find approximate middle, but avoid placing right next to afterFirst ad
            const middleBlockIndex = Math.floor(blockElements.length / 2);
            const middleElement = blockElements[middleBlockIndex];
            middleInsertIndex = children.indexOf(middleElement);

            // Make sure middle ad is at least 3 elements away from afterFirst ad
            if (afterFirstInsertIndex !== -1 && middleInsertIndex !== -1) {
                if (Math.abs(middleInsertIndex - afterFirstInsertIndex) < 3) {
                    // Move middle ad further down
                    const newMiddleBlockIndex = Math.min(middleBlockIndex + 2, blockElements.length - 1);
                    middleInsertIndex = children.indexOf(blockElements[newMiddleBlockIndex]);
                }
            }
        }

        // Build content blocks with ads inserted
        let currentHtml = '';
        let afterFirstAdded = false;
        let middleAdded = false;

        children.forEach((child, index) => {
            // Check if we should insert an ad before this element
            if (showAdAfterFirst && !afterFirstAdded && index === afterFirstInsertIndex) {
                if (currentHtml) {
                    blocks.push({ type: 'html', content: currentHtml });
                    currentHtml = '';
                }
                blocks.push({
                    type: 'ad',
                    adPosition: 'post_after_first',
                    adSlotId: adSlotAfterFirst
                });
                afterFirstAdded = true;
            }

            if (showAdMiddle && !middleAdded && index === middleInsertIndex && index !== afterFirstInsertIndex) {
                if (currentHtml) {
                    blocks.push({ type: 'html', content: currentHtml });
                    currentHtml = '';
                }
                blocks.push({
                    type: 'ad',
                    adPosition: 'post_middle',
                    adSlotId: adSlotMiddle
                });
                middleAdded = true;
            }

            // Add the element's HTML
            currentHtml += (child as HTMLElement).outerHTML;
        });

        // Add remaining HTML
        if (currentHtml) {
            blocks.push({ type: 'html', content: currentHtml });
        }

        // Add bottom ad
        if (showAdBottom) {
            blocks.push({
                type: 'ad',
                adPosition: 'post_bottom',
                adSlotId: adSlotBottom
            });
        }

        return blocks;
    }, [content, showAds, showAdAfterFirst, showAdMiddle, showAdBottom, adSlotAfterFirst, adSlotMiddle, adSlotBottom, minParagraphsForMiddleAd, isClient]);

    return (
        <div className={className}>
            {contentBlocks.map((block, index) => {
                if (block.type === 'ad') {
                    return (
                        <LazyAdUnit
                            key={`ad-${block.adPosition}-${index}`}
                            format={adFormat}
                            position={block.adPosition}
                            slotId={block.adSlotId}
                            className="my-8"
                        />
                    );
                }

                return (
                    <div
                        key={`content-${index}`}
                        dangerouslySetInnerHTML={{ __html: block.content || '' }}
                    />
                );
            })}
        </div>
    );
}
