/**
 * Web Scraper for Discovery
 * 
 * Fetches and parses website content to extract company information.
 * Used to analyze potential leads discovered via search.
 */

export interface ScrapedContent {
  success: boolean;
  url: string;
  title?: string;
  description?: string;
  /** Main text content from the page (cleaned) */
  textContent?: string;
  /** Company name extracted from the page */
  companyName?: string;
  /** Services/products mentioned */
  services?: string[];
  /** Contact information found */
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  /** Social media links */
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  /** Keywords found on the page */
  keywords?: string[];
  /** Error message if scraping failed */
  error?: string;
  /** Time taken to scrape (ms) */
  scrapeDurationMs?: number;
}

export interface ScrapeOptions {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Whether to follow redirects (default: true) */
  followRedirects?: boolean;
  /** Maximum content length to process (default: 500KB) */
  maxContentLength?: number;
}

/**
 * Web Scraper class
 * 
 * Fetches URLs and extracts useful information for lead discovery.
 */
export class WebScraper {
  private defaultOptions: Required<ScrapeOptions> = {
    timeout: 10000,
    followRedirects: true,
    maxContentLength: 500 * 1024, // 500KB
  };

  /**
   * Scrape a single URL and extract company information
   */
  async scrape(url: string, options?: ScrapeOptions): Promise<ScrapedContent> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      // Validate URL
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
          success: false,
          url,
          error: 'Invalid URL protocol - must be http or https',
        };
      }

      // Fetch the page
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: opts.followRedirects ? 'follow' : 'manual',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          url,
          error: `HTTP ${response.status}: ${response.statusText}`,
          scrapeDurationMs: Date.now() - startTime,
        };
      }

      // Check content type
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        return {
          success: false,
          url,
          error: `Unexpected content type: ${contentType}`,
          scrapeDurationMs: Date.now() - startTime,
        };
      }

      // Get HTML content
      const html = await response.text();
      
      // Check content length
      if (html.length > opts.maxContentLength) {
        // Truncate but still try to process
        console.warn(`Content truncated for ${url}: ${html.length} bytes`);
      }

      // Parse and extract content
      const result = this.parseHtml(html, url);
      result.scrapeDurationMs = Date.now() - startTime;
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scraping error';
      
      // Handle specific errors
      if (errorMessage.includes('abort')) {
        return {
          success: false,
          url,
          error: `Timeout after ${opts.timeout}ms`,
          scrapeDurationMs: Date.now() - startTime,
        };
      }

      return {
        success: false,
        url,
        error: errorMessage,
        scrapeDurationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Scrape multiple URLs in parallel (with concurrency limit)
   */
  async scrapeMany(
    urls: string[],
    options?: ScrapeOptions & { concurrency?: number }
  ): Promise<ScrapedContent[]> {
    const concurrency = options?.concurrency || 3;
    const results: ScrapedContent[] = [];
    
    // Process in batches to respect concurrency
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(url => this.scrape(url, options))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Parse HTML and extract relevant information
   */
  private parseHtml(html: string, url: string): ScrapedContent {
    try {
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? this.cleanText(titleMatch[1]) : undefined;

      // Extract meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      const description = descMatch ? this.cleanText(descMatch[1]) : undefined;

      // Extract Open Graph data
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);

      // Extract main text content (remove scripts, styles, etc.)
      const textContent = this.extractTextContent(html);

      // Extract company name from various sources
      const companyName = this.extractCompanyName(html, title, url);

      // Extract contact information
      const contact = this.extractContactInfo(html, textContent);

      // Extract social media links
      const socialLinks = this.extractSocialLinks(html);

      // Extract keywords/services
      const keywords = this.extractKeywords(textContent, description);
      const services = this.extractServices(textContent);

      return {
        success: true,
        url,
        title: title || ogTitleMatch?.[1],
        description: description || ogDescMatch?.[1],
        textContent: textContent.substring(0, 5000), // Limit stored text
        companyName,
        services,
        contact,
        socialLinks,
        keywords,
      };
    } catch (error) {
      return {
        success: false,
        url,
        error: `Parse error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Extract clean text content from HTML
   */
  private extractTextContent(html: string): string {
    // Remove script and style tags with their content
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'");

    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  /**
   * Extract company name from page content
   */
  private extractCompanyName(html: string, title?: string, url?: string): string | undefined {
    // Try schema.org Organization
    const schemaMatch = html.match(/"name"\s*:\s*"([^"]+)"[^}]*"@type"\s*:\s*"Organization"/i) ||
                        html.match(/"@type"\s*:\s*"Organization"[^}]*"name"\s*:\s*"([^"]+)"/i);
    if (schemaMatch) {
      return this.cleanText(schemaMatch[1]);
    }

    // Try og:site_name
    const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i);
    if (ogSiteMatch) {
      return this.cleanText(ogSiteMatch[1]);
    }

    // Clean up title
    if (title) {
      // Remove common suffixes
      const cleanTitle = title
        .replace(/\s*[-|–—]\s*(Home|About|Welcome|Official Site|Official Website).*$/i, '')
        .replace(/\s*(Home|About|Welcome|Official Site|Official Website)\s*[-|–—]\s*/i, '')
        .trim();
      
      if (cleanTitle && cleanTitle.length > 2 && cleanTitle.length < 100) {
        return cleanTitle;
      }
    }

    // Try to extract from domain
    if (url) {
      try {
        const hostname = new URL(url).hostname
          .replace(/^www\./, '')
          .split('.')[0];
        // Capitalize first letter
        if (hostname && hostname.length > 2) {
          return hostname.charAt(0).toUpperCase() + hostname.slice(1);
        }
      } catch {
        // Ignore URL parsing errors
      }
    }

    return title;
  }

  /**
   * Extract contact information from page
   */
  private extractContactInfo(html: string, textContent: string): ScrapedContent['contact'] {
    const contact: ScrapedContent['contact'] = {};

    // Extract email addresses
    const emailMatch = textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      contact.email = emailMatch[0].toLowerCase();
    }

    // Extract phone numbers (various formats)
    const phoneMatch = textContent.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
    if (phoneMatch) {
      contact.phone = phoneMatch[0].trim();
    }

    // Look for address in structured data
    const addressMatch = html.match(/"streetAddress"\s*:\s*"([^"]+)"/i);
    if (addressMatch) {
      contact.address = this.cleanText(addressMatch[1]);
    }

    return Object.keys(contact).length > 0 ? contact : undefined;
  }

  /**
   * Extract social media links
   */
  private extractSocialLinks(html: string): ScrapedContent['socialLinks'] {
    const links: ScrapedContent['socialLinks'] = {};

    // LinkedIn
    const linkedinMatch = html.match(/href=["']([^"']*linkedin\.com\/(?:company|in)\/[^"']*)/i);
    if (linkedinMatch) links.linkedin = linkedinMatch[1];

    // Twitter/X
    const twitterMatch = html.match(/href=["']([^"']*(?:twitter|x)\.com\/[^"']*)/i);
    if (twitterMatch) links.twitter = twitterMatch[1];

    // Facebook
    const facebookMatch = html.match(/href=["']([^"']*facebook\.com\/[^"']*)/i);
    if (facebookMatch) links.facebook = facebookMatch[1];

    // Instagram
    const instagramMatch = html.match(/href=["']([^"']*instagram\.com\/[^"']*)/i);
    if (instagramMatch) links.instagram = instagramMatch[1];

    return Object.keys(links).length > 0 ? links : undefined;
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(textContent: string, description?: string): string[] {
    const text = `${description || ''} ${textContent}`.toLowerCase();
    const keywords: string[] = [];

    // Industry/service keywords to look for
    const targetKeywords = [
      // Marketing & Agency
      'marketing', 'branding', 'advertising', 'creative agency', 'brand strategy',
      'digital marketing', 'social media', 'content marketing', 'pr', 'public relations',
      'activation', 'experiential', 'btl', 'atl', 'promotions', 'campaigns',
      // Business types
      'agency', 'studio', 'consultancy', 'consulting', 'services',
      // Size indicators  
      'team', 'employees', 'staff', 'office', 'clients',
      // Services
      'design', 'strategy', 'creative', 'production', 'events', 'exhibitions',
    ];

    for (const keyword of targetKeywords) {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Extract services/offerings from content
   */
  private extractServices(textContent: string): string[] {
    const text = textContent.toLowerCase();
    const services: string[] = [];

    // Common service patterns
    const servicePatterns = [
      /(?:we offer|our services|services include|we provide|we specialize in)[:\s]+([^.]+)/gi,
      /(?:services|solutions|offerings)[:\s]+([^.]+)/gi,
    ];

    for (const pattern of servicePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length < 200) {
          services.push(match[1].trim());
        }
      }
    }

    return services.slice(0, 5); // Limit to first 5
  }

  /**
   * Clean text by removing extra whitespace and trimming
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Singleton instance
export const webScraper = new WebScraper();
