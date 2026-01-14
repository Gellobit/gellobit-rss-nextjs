import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';
import { settingsService } from './settings.service';
import type { ScrapedContent } from '../../prompts';

/**
 * Scraper Service - Enhanced web scraping with Google redirect handling
 * Extracts clean content from URLs for AI processing
 */
export class ScraperService {
  private static instance: ScraperService;

  private constructor() {}

  static getInstance(): ScraperService {
    if (!ScraperService.instance) {
      ScraperService.instance = new ScraperService();
    }
    return ScraperService.instance;
  }

  /**
   * Scrape content from a URL
   *
   * @param url - URL to scrape
   * @param feedId - Optional feed ID for logging
   * @returns Scraped content or null if failed
   */
  async scrapeUrl(
    url: string,
    feedId?: string
  ): Promise<ScrapedContent | null> {
    const startTime = Date.now();

    try {
      // Load scraping settings
      const followGoogleFeedproxy = await settingsService.get('scraping.follow_google_feedproxy');

      // Resolve Google FeedProxy redirects (if enabled)
      const resolvedUrl = followGoogleFeedproxy
        ? await this.resolveGoogleRedirect(url)
        : url;

      // Load settings for scraping
      const timeout = await settingsService.get('scraping.request_timeout');
      const userAgent = await settingsService.get('scraping.user_agent');
      const minContentLength = await settingsService.get('scraping.min_content_length');
      const maxContentLength = await settingsService.get('scraping.max_content_length');

      // Fetch content
      const html = await this.fetchHtml(resolvedUrl, userAgent, timeout);

      if (!html) {
        throw new Error('Empty response from URL');
      }

      // Extract content with Cheerio
      const scraped = this.extractContent(html, resolvedUrl, minContentLength, maxContentLength);

      const executionTime = Date.now() - startTime;

      await logger.info('Content scraped successfully', {
        url: resolvedUrl,
        feed_id: feedId,
        content_length: scraped.content.length,
        execution_time_ms: executionTime,
      });

      return scraped;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      await logger.error('Scraping failed', {
        url,
        feed_id: feedId,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: executionTime,
      });

      return null;
    }
  }

  /**
   * Resolve Google redirect URLs (Alerts, FeedProxy) to final destination URL
   * Matches WordPress plugin behavior for Google Alerts URLs
   *
   * @param url - Original URL (may be Google redirect)
   * @returns Resolved final URL
   */
  private async resolveGoogleRedirect(url: string): Promise<string> {
    // 1. Check for Google Alerts URL pattern: google.com/url?...&url=ACTUAL_URL
    // This is the most common pattern from Google Alerts RSS feeds
    if (url.includes('google.com/url')) {
      try {
        const parsedUrl = new URL(url);
        const targetUrl = parsedUrl.searchParams.get('url');

        if (targetUrl) {
          await logger.debug('Resolved Google Alerts redirect', {
            original: url,
            resolved: targetUrl,
          });
          return targetUrl;
        }
      } catch (error) {
        await logger.warning('Failed to parse Google Alerts URL', {
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 2. Check for Google FeedProxy URL
    if (url.includes('feedproxy.google.com')) {
      try {
        await logger.debug('Resolving Google FeedProxy redirect', { url });

        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual', // Don't auto-follow redirects
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(10000),
        });

        // Get Location header for redirect
        const location = response.headers.get('Location');

        if (location && response.status >= 300 && response.status < 400) {
          await logger.debug('FeedProxy redirect resolved', {
            original: url,
            resolved: location,
          });
          return location;
        }
      } catch (error) {
        await logger.warning('Failed to resolve FeedProxy redirect', {
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // No redirect pattern found, return original URL
    return url;
  }

  /**
   * Fetch HTML content from URL
   *
   * @param url - URL to fetch
   * @param userAgent - User agent string
   * @param timeout - Request timeout in ms
   * @returns HTML content or null
   */
  private async fetchHtml(url: string, userAgent: string, timeout: number): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type') || '';

      // Check if response is HTML
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Extract clean content from HTML using Cheerio
   *
   * @param html - HTML content
   * @param url - Source URL
   * @param minLength - Minimum content length
   * @param maxLength - Maximum content length
   * @returns Scraped content structure
   */
  private extractContent(html: string, url: string, minLength: number, maxLength: number): ScrapedContent {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, iframe, noscript').remove();
    $('.advertisement, .ads, .social-share, .comments').remove();

    // Extract title
    let title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text() ||
      '';

    title = this.cleanText(title);

    // Extract main content
    // Try to find article content using common selectors
    let content = '';

    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      'main',
      '#content',
      '.post',
      '.article',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback: extract all paragraph text
    if (!content || content.trim().length < minLength) {
      content = $('p')
        .map((_, el) => $(el).text())
        .get()
        .join('\n');
    }

    // Final fallback: extract body text
    if (!content || content.trim().length < minLength) {
      content = $('body').text();
    }

    // Clean content
    content = this.cleanText(content);

    // Limit content length (AI providers have token limits)
    if (content.length > maxLength) {
      const originalLength = content.length;
      content = content.substring(0, maxLength) + '...';

      logger.warning('Content truncated due to length', {
        url,
        original_length: originalLength,
        truncated_length: maxLength,
      });
    }

    // Note: Featured images are now handled by feed fallback images only
    // This reduces scraping complexity since posts are private (not SEO indexed)

    return {
      title,
      content,
      url,
    };
  }

  /**
   * Extract featured image from HTML
   * Tries multiple strategies: OG image, Twitter card, first content image
   */
  private extractFeaturedImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
    // 1. Try Open Graph image
    let imageUrl = $('meta[property="og:image"]').attr('content');

    // 2. Try Twitter card image
    if (!imageUrl) {
      imageUrl = $('meta[name="twitter:image"]').attr('content');
    }

    // 3. Try schema.org image
    if (!imageUrl) {
      imageUrl = $('meta[itemprop="image"]').attr('content');
    }

    // 4. Try first image in article/content area
    if (!imageUrl) {
      const contentSelectors = [
        'article img',
        '.post-content img',
        '.entry-content img',
        '.article-content img',
        'main img',
        '.content img'
      ];

      for (const selector of contentSelectors) {
        const img = $(selector).first();
        if (img.length > 0) {
          imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
          if (imageUrl) break;
        }
      }
    }

    // 5. Try first reasonably sized image
    if (!imageUrl) {
      $('img').each((_, el) => {
        const img = $(el);
        const src = img.attr('src');
        const width = parseInt(img.attr('width') || '0');
        const height = parseInt(img.attr('height') || '0');

        // Skip small images (icons, avatars, etc.)
        if (src && (width >= 200 || height >= 200 || (!width && !height))) {
          // Skip common icon/avatar patterns
          if (!src.match(/avatar|icon|logo|button|sprite|badge/i)) {
            imageUrl = src;
            return false; // break
          }
        }
      });
    }

    if (!imageUrl) {
      return null;
    }

    // Resolve relative URLs
    return this.resolveImageUrl(imageUrl, baseUrl);
  }

  /**
   * Resolve relative image URL to absolute URL
   */
  private resolveImageUrl(imageUrl: string, baseUrl: string): string {
    // Already absolute URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // Protocol-relative URL
    if (imageUrl.startsWith('//')) {
      return 'https:' + imageUrl;
    }

    try {
      const base = new URL(baseUrl);

      // Absolute path
      if (imageUrl.startsWith('/')) {
        return `${base.protocol}//${base.host}${imageUrl}`;
      }

      // Relative path
      return new URL(imageUrl, baseUrl).href;
    } catch {
      return imageUrl;
    }
  }

  /**
   * Clean and normalize text
   *
   * @param text - Raw text
   * @returns Cleaned text
   */
  private cleanText(text: string): string {
    return (
      text
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace
        .trim()
    );
  }

  /**
   * Batch scrape multiple URLs
   *
   * @param urls - Array of URLs to scrape
   * @param feedId - Optional feed ID for logging
   * @param concurrency - Number of concurrent requests (default 3)
   * @returns Array of scraped content (null for failed scrapes)
   */
  async scrapeUrls(
    urls: string[],
    feedId?: string,
    concurrency: number = 3
  ): Promise<(ScrapedContent | null)[]> {
    const results: (ScrapedContent | null)[] = [];

    // Process URLs in batches
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map((url) => this.scrapeUrl(url, feedId))
      );

      results.push(...batchResults);

      // Small delay between batches to avoid overwhelming servers
      if (i + concurrency < urls.length) {
        await this.delay(1000); // 1 second delay
      }
    }

    return results;
  }

  /**
   * Utility delay function
   *
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get scraping statistics
   *
   * @returns Statistics about recent scraping activity
   */
  async getScrapingStats() {
    const supabase = (await import('../utils/supabase-admin')).createAdminClient();

    const { data: logs } = await supabase
      .from('processing_logs')
      .select('*')
      .or('message.ilike.%scrape%,message.ilike.%fetch%')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const successful = logs?.filter((l) => l.level === 'info').length || 0;
    const failed = logs?.filter((l) => l.level === 'error').length || 0;

    return {
      scrapes_last_24h: logs?.length || 0,
      successful_scrapes: successful,
      failed_scrapes: failed,
      success_rate: logs?.length ? (successful / logs.length) * 100 : 0,
    };
  }
}

// Export singleton instance
export const scraperService = ScraperService.getInstance();
