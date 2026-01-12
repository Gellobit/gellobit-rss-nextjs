import Parser from 'rss-parser';

/**
 * RSS/Atom feed parser with custom fields
 */

interface CustomFeedItem {
    title?: string;
    link?: string;
    pubDate?: string;
    content?: string;
    contentSnippet?: string;
    guid?: string;
    categories?: string[];
    isoDate?: string;
    enclosure?: {
        url?: string;
        type?: string;
    };
}

interface CustomFeed {
    items: CustomFeedItem[];
    title?: string;
    description?: string;
    link?: string;
}

/**
 * Parse RSS/Atom feed from URL
 */
export async function parseRSSFeed(url: string): Promise<CustomFeedItem[]> {
    const parser = new Parser<CustomFeed, CustomFeedItem>({
        timeout: 30000,
        headers: {
            'User-Agent': 'GellobitRSSProcessor/1.0',
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml'
        }
    });

    try {
        const feed = await parser.parseURL(url);
        return feed.items || [];
    } catch (error) {
        throw new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Normalize RSS item to consistent format
 */
export interface NormalizedRSSItem {
    title: string;
    link: string;
    description: string;
    content: string;
    pubDate: string;
    guid: string;
    featuredImage?: string;
}

export function normalizeRSSItem(item: CustomFeedItem): NormalizedRSSItem | null {
    // Must have title and link
    if (!item.title || !item.link) {
        return null;
    }

    // Clean title: strip HTML entities and tags
    const cleanTitle = stripHTML(item.title).trim();

    // Get content (prefer full content over snippet)
    const content = item.content || item.contentSnippet || '';
    const description = item.contentSnippet || stripHTML(content).substring(0, 500);

    // Parse date
    let pubDate = new Date().toISOString();
    if (item.isoDate) {
        pubDate = item.isoDate;
    } else if (item.pubDate) {
        pubDate = new Date(item.pubDate).toISOString();
    }

    // Generate GUID if missing
    const guid = item.guid || generateGUID(item.link, cleanTitle);

    // Extract featured image
    const featuredImage = item.enclosure?.url || extractImageFromContent(content);

    return {
        title: cleanTitle,
        link: validateURL(item.link) || item.link,
        description: description.substring(0, 500),
        content: content,
        pubDate,
        guid,
        featuredImage
    };
}

/**
 * Strip HTML tags from string
 */
function stripHTML(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Generate GUID from link and title
 */
function generateGUID(link: string, title: string): string {
    return `${link}-${title}`.replace(/\s+/g, '-').toLowerCase();
}

/**
 * Validate and clean URL
 */
function validateURL(url: string): string | null {
    try {
        const parsed = new URL(url);
        return parsed.toString();
    } catch {
        return null;
    }
}

/**
 * Extract first image URL from HTML content
 */
function extractImageFromContent(html: string): string | undefined {
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch && imgMatch[1]) {
        return validateURL(imgMatch[1]) || undefined;
    }
    return undefined;
}

/**
 * Resolve Google redirect URLs
 * Handles feedproxy.google.com and google.com/url?url= redirects
 */
export function resolveGoogleRedirect(url: string): string {
    try {
        const parsed = new URL(url);

        // Handle feedproxy.google.com redirects
        if (parsed.hostname.includes('feedproxy.google.com') || parsed.hostname.includes('feedburner.com')) {
            // Extract the real URL from the path or query
            const realUrl = parsed.searchParams.get('url') || parsed.pathname.split('/').pop();
            if (realUrl && realUrl.startsWith('http')) {
                return realUrl;
            }
        }

        // Handle google.com/url?url= redirects
        if (parsed.hostname.includes('google.com') && parsed.pathname.includes('/url')) {
            const realUrl = parsed.searchParams.get('url') || parsed.searchParams.get('q');
            if (realUrl) {
                return decodeURIComponent(realUrl);
            }
        }

        return url;
    } catch {
        return url;
    }
}
