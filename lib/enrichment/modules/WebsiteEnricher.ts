/**
 * Phase 2: Enrichment - Website Enricher Module
 * 
 * Extracts basic metadata from company websites.
 * MVP: Basic metadata only (title, description, status code).
 * Future: Full structured signal extraction (reuse IWebsiteSignalExtractor).
 */

import type { ICompanyEnricher } from '../ICompanyEnricher';
import type {
  CompanyEnrichmentInput,
  EnrichmentResult,
} from '../types';

/**
 * Website Enricher
 * 
 * Enriches company data by extracting metadata from Company.website URL.
 * - Validates website accessibility
 * - Extracts basic metadata (title, description, content-type, status code)
 * - Handles errors gracefully (invalid URLs, timeouts, HTTP errors)
 */
export class WebsiteEnricher implements ICompanyEnricher {
  private readonly timeoutMs = 10000; // 10 seconds timeout

  getName(): string {
    return 'website';
  }

  async enrich(
    company: CompanyEnrichmentInput
  ): Promise<EnrichmentResult> {
    const timestamp = new Date().toISOString();

    // Check if website URL is available
    if (!company.website) {
      return {
        source: this.getName(),
        success: false,
        timestamp,
        error: 'Company website URL not available',
      };
    }

    try {
      // Validate URL format
      const url = this.normalizeUrl(company.website);
      if (!url) {
        return {
          source: this.getName(),
          success: false,
          timestamp,
          error: `Invalid website URL: ${company.website}`,
        };
      }

      // Fetch website with timeout
      const response = await this.fetchWithTimeout(url, this.timeoutMs);
      const statusCode = response.status;
      const contentType = response.headers.get('content-type') || undefined;

      // Only parse HTML responses (status 200-299)
      if (response.ok && contentType?.includes('text/html')) {
        const html = await response.text();
        const metadata = this.extractMetadata(html);

        // Return EnrichmentResult format (runner will convert to WebsiteEnrichmentResult)
        return {
          source: this.getName(),
          timestamp,
          success: true,
          data: {
            url,
            title: metadata.title,
            description: metadata.description,
            accessible: true,
            statusCode,
            contentType,
          },
        };
      } else {
        // Non-HTML response or non-2xx status
        return {
          source: this.getName(),
          timestamp,
          success: false,
          data: {
            url,
            accessible: false,
            statusCode,
            contentType,
          },
          error: `HTTP ${statusCode}${contentType ? ` (${contentType})` : ''}`,
        };
      }
    } catch (error: unknown) {
      // Handle network errors, timeouts, etc.
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching website';
      return {
        source: this.getName(),
        success: false,
        timestamp,
        error: errorMessage,
      };
    }
  }

  /**
   * Normalize URL: Add protocol if missing, validate format
   */
  private normalizeUrl(url: string): string | null {
    try {
      // Add https:// if no protocol specified
      if (!url.match(/^https?:\/\//i)) {
        url = `https://${url}`;
      }

      // Validate URL format
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch {
      return null;
    }
  }

  /**
   * Fetch URL with timeout
   */
  private async fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CompanyEnricher/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * Extract basic metadata from HTML
   * MVP: Simple regex-based extraction (title, meta description)
   * Future: Use proper HTML parser (cheerio, jsdom)
   */
  private extractMetadata(html: string): { title?: string; description?: string } {
    const metadata: { title?: string; description?: string } = {};

    // Extract title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract meta description
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    return metadata;
  }
}
