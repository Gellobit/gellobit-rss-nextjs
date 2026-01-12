<?php
/**
 * Content Scraper class for RSS Processor Plugin
 * Simplified and extracted from theme
 */

if (!defined('ABSPATH')) {
    exit;
}

class Gellobit_RSS_Content_Scraper {
    
    private static $instance = null;
    
    private $config = [
        'timeout' => 30,
        'max_redirects' => 5,
        'user_agents' => [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ],
        'min_content_length' => 50,
        'max_content_length' => 20000
    ];
    
    private $content_selectors = [
        'article',
        'main',
        '[role="main"]',
        '.main-content',
        '#main-content',
        '.content',
        '#content',
        '.post-content',
        '.entry-content',
        '.article-content'
    ];
    
    private $remove_selectors = [
        'script',
        'style',
        'nav',
        'header',
        'footer',
        'aside',
        '.sidebar',
        '.advertisement',
        '.ads',
        '.social-share',
        '.comments'
    ];
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $saved_config = get_option('gellobit_rss_scraper_config', []);
        $this->config = array_merge($this->config, $saved_config);
    }
    
    /**
     * Scrape content from URL
     */
    public function scrape_url($url) {
        try {
            // Resolve Google redirect URLs
            $url = $this->resolve_google_redirect_url($url);
            
            if (!$this->validate_url($url)) {
                throw new Exception('Invalid URL provided');
            }
            
            // Fetch page content
            $html = $this->fetch_page_content($url);
            
            if (!$html) {
                throw new Exception('Failed to fetch page content');
            }
            
            // Parse content
            $parsed_content = $this->parse_html_content($html, $url);
            
            // Validate extracted content
            if (!$this->validate_scraped_content($parsed_content)) {
                throw new Exception('Invalid or insufficient content extracted');
            }
            
            return [
                'success' => true,
                'url' => $url,
                'content' => $parsed_content,
                'scraped_at' => current_time('mysql')
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'url' => $url,
                'error' => $e->getMessage(),
                'scraped_at' => current_time('mysql')
            ];
        }
    }
    
    /**
     * Resolve Google redirect URLs
     */
    private function resolve_google_redirect_url($url) {
        if (strpos($url, 'google.com/url') !== false) {
            $parsed = parse_url($url);
            if (isset($parsed['query'])) {
                parse_str($parsed['query'], $params);
                if (isset($params['url'])) {
                    return $params['url'];
                }
            }
        }
        return $url;
    }
    
    /**
     * Validate URL
     */
    private function validate_url($url) {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }
        
        $parsed = parse_url($url);
        if (!in_array($parsed['scheme'], ['http', 'https'])) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Fetch page content
     */
    private function fetch_page_content($url) {
        $user_agent = $this->config['user_agents'][array_rand($this->config['user_agents'])];
        
        $args = [
            'timeout' => $this->config['timeout'],
            'redirection' => $this->config['max_redirects'],
            'headers' => [
                'User-Agent' => $user_agent,
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'en-US,en;q=0.5'
            ],
            'sslverify' => false
        ];
        
        $response = wp_remote_get($url, $args);
        
        if (is_wp_error($response)) {
            throw new Exception('HTTP request failed: ' . $response->get_error_message());
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            throw new Exception("HTTP {$response_code} response");
        }
        
        $body = wp_remote_retrieve_body($response);
        if (empty($body)) {
            throw new Exception('Empty response body');
        }
        
        // Handle encoding
        $content_type = wp_remote_retrieve_header($response, 'content-type');
        if (preg_match('/charset=([^\s;]+)/i', $content_type, $matches)) {
            $charset = $matches[1];
            if (strtolower($charset) !== 'utf-8') {
                $body = mb_convert_encoding($body, 'UTF-8', $charset);
            }
        }
        
        return $body;
    }
    
    /**
     * Parse HTML content
     */
    private function parse_html_content($html, $url) {
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        
        // Add meta charset for UTF-8
        $html = '<?xml encoding="UTF-8">' . $html;
        
        @$dom->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        
        $xpath = new DOMXPath($dom);
        
        // Remove unwanted elements
        $this->remove_unwanted_elements($dom, $xpath);
        
        // Extract metadata
        $metadata = $this->extract_metadata($dom, $xpath);
        
        // Extract main content
        $main_content = $this->extract_main_content($dom, $xpath);
        
        // Fallback if no content found
        if (empty($main_content['text'])) {
            $main_content = $this->extract_content_fallback($dom, $xpath);
        }
        
        return array_merge($metadata, $main_content);
    }
    
    /**
     * Remove unwanted elements
     */
    private function remove_unwanted_elements($dom, $xpath) {
        foreach ($this->remove_selectors as $selector) {
            $elements = $this->css_to_xpath($xpath, $selector);
            foreach ($elements as $element) {
                if ($element->parentNode) {
                    $element->parentNode->removeChild($element);
                }
            }
        }
    }
    
    /**
     * Extract metadata
     */
    private function extract_metadata($dom, $xpath) {
        $metadata = [
            'title' => '',
            'description' => '',
            'author' => '',
            'published_date' => '',
            'image' => ''
        ];
        
        // Title
        $title_elements = $xpath->query('//title | //meta[@property="og:title"]/@content');
        if ($title_elements->length > 0) {
            $metadata['title'] = trim($title_elements->item(0)->nodeValue);
        }
        
        // Description
        $desc_elements = $xpath->query('//meta[@name="description"]/@content | //meta[@property="og:description"]/@content');
        if ($desc_elements->length > 0) {
            $metadata['description'] = trim($desc_elements->item(0)->nodeValue);
        }
        
        // Author
        $author_elements = $xpath->query('//meta[@name="author"]/@content');
        if ($author_elements->length > 0) {
            $metadata['author'] = trim($author_elements->item(0)->nodeValue);
        }
        
        // Published date
        $date_elements = $xpath->query('//meta[@property="article:published_time"]/@content | //time[@datetime]/@datetime');
        if ($date_elements->length > 0) {
            $metadata['published_date'] = trim($date_elements->item(0)->nodeValue);
        }
        
        // Image
        $image_elements = $xpath->query('//meta[@property="og:image"]/@content');
        if ($image_elements->length > 0) {
            $metadata['image'] = trim($image_elements->item(0)->nodeValue);
        }
        
        return $metadata;
    }
    
    /**
     * Extract main content
     */
    private function extract_main_content($dom, $xpath) {
        $content = [
            'text' => '',
            'html' => '',
            'images' => [],
            'links' => []
        ];
        
        foreach ($this->content_selectors as $selector) {
            $elements = $this->css_to_xpath($xpath, $selector);
            
            if ($elements->length > 0) {
                $main_element = $elements->item(0);
                
                $content['text'] = $this->extract_text_content($main_element);
                $content['html'] = $this->get_clean_html($main_element);
                
                if (strlen($content['text']) >= $this->config['min_content_length']) {
                    break;
                }
            }
        }
        
        return $content;
    }
    
    /**
     * Extract content fallback
     */
    private function extract_content_fallback($dom, $xpath) {
        $content = [
            'text' => '',
            'html' => '',
            'images' => [],
            'links' => []
        ];
        
        // Get all paragraphs
        $paragraphs = $xpath->query('//p[string-length(normalize-space(.)) > 30]');
        
        $text_parts = [];
        foreach ($paragraphs as $p) {
            $text = trim($p->textContent);
            if (strlen($text) > 30) {
                $text_parts[] = $text;
            }
        }
        
        $content['text'] = implode("\n\n", $text_parts);
        
        return $content;
    }
    
    /**
     * Extract text content from element
     */
    private function extract_text_content($element) {
        $clone = $element->cloneNode(true);
        
        // Remove scripts and styles
        $scripts = $clone->getElementsByTagName('script');
        for ($i = $scripts->length - 1; $i >= 0; $i--) {
            $scripts->item($i)->parentNode->removeChild($scripts->item($i));
        }
        
        $styles = $clone->getElementsByTagName('style');
        for ($i = $styles->length - 1; $i >= 0; $i--) {
            $styles->item($i)->parentNode->removeChild($styles->item($i));
        }
        
        $text = $clone->textContent;
        
        // Clean whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = preg_replace('/\n\s*\n/', "\n\n", $text);
        
        return trim($text);
    }
    
    /**
     * Get clean HTML
     */
    private function get_clean_html($element) {
        $html = $element->ownerDocument->saveHTML($element);
        
        // Remove unnecessary attributes
        $html = preg_replace('/ (id|class|style|onclick)="[^"]*"/', '', $html);
        
        // Remove comments
        $html = preg_replace('/<!--.*?-->/', '', $html);
        
        return $html;
    }
    
    /**
     * Simple CSS to XPath converter
     */
    private function css_to_xpath($xpath, $selector) {
        $selector = trim($selector);
        
        // ID selector
        if (strpos($selector, '#') === 0) {
            $id = substr($selector, 1);
            return $xpath->query("//*[@id='{$id}']");
        }
        
        // Class selector
        if (strpos($selector, '.') === 0) {
            $class = substr($selector, 1);
            return $xpath->query("//*[contains(@class, '{$class}')]");
        }
        
        // Attribute selector
        if (preg_match('/\[([^=]+)="([^"]+)"\]/', $selector, $matches)) {
            return $xpath->query("//*[@{$matches[1]}='{$matches[2]}']");
        }
        
        // Element selector
        return $xpath->query("//{$selector}");
    }
    
    /**
     * Validate scraped content
     */
    private function validate_scraped_content($content) {
        if (empty($content['text'])) {
            return false;
        }
        
        $text_length = strlen($content['text']);
        if ($text_length < $this->config['min_content_length']) {
            return false;
        }
        
        if ($text_length > $this->config['max_content_length']) {
            $content['text'] = substr($content['text'], 0, $this->config['max_content_length']);
        }
        
        return true;
    }
    
    /**
     * Update configuration
     */
    public function update_config($new_config) {
        $this->config = array_merge($this->config, $new_config);
        update_option('gellobit_rss_scraper_config', $this->config);
        return true;
    }
    
    /**
     * Get current configuration
     */
    public function get_config() {
        return $this->config;
    }
}
?>