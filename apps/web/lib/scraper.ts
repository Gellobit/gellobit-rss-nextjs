import * as cheerio from 'cheerio';

export interface ScrapedContent {
    title: string;
    description: string;
    text: string;
    html: string;
    image?: string;
    originalUrl: string;
}

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
];

export async function scrapeUrl(url: string): Promise<ScrapedContent | null> {
    try {
        console.log(`Scraping URL: ${url}`);
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.status}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove unwanted elements
        $('script, style, nav, header, footer, aside, .sidebar, .ads, .social-share, .comments').remove();

        // Metadata extraction
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        const image = $('meta[property="og:image"]').attr('content') || '';

        // Content Extraction Heuristics
        let mainContent = $('article, main, [role="main"], .main-content, #content, .entry-content').first();

        // Fallback: Try to find the density of text
        if (!mainContent.length || mainContent.text().length < 50) {
            // Simple fallback: Look for div with most paragraphs
            let maxPCount = 0;
            let bestDiv = $('body');

            $('div').each((i, el) => {
                const pCount = $(el).find('p').length;
                if (pCount > maxPCount) {
                    maxPCount = pCount;
                    bestDiv = $(el);
                }
            });
            mainContent = bestDiv;
        }

        const text = mainContent.text().replace(/\s+/g, ' ').trim();
        const cleanHtml = mainContent.html() || '';

        return {
            title,
            description,
            text,
            html: cleanHtml,
            image,
            originalUrl: url
        };

    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return null;
    }
}
