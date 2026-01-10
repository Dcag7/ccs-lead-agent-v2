/**
 * Phase 1 Discovery - Website Signal Extraction Implementation
 * 
 * Extracts structured signals from company websites:
 * 1. Services Offered
 * 2. Industries Served
 * 3. Locations
 * 4. Contact Channels (email, phone, contact forms)
 * 
 * Note: Crawl depth is UNDEFINED - this is a basic implementation
 * focusing on structured signal extraction only (not raw content storage)
 * 
 * Based on PHASE_1_Discovery_MVP_Definition.md
 */

import type { IWebsiteSignalExtractor } from './IWebsiteSignalExtractor';
import type {
  WebsiteSignalExtractionInput,
  WebsiteSignalExtractionOutput,
  WebsiteSignals,
  WebsiteSignalServices,
  WebsiteSignalIndustries,
  WebsiteSignalLocations,
  WebsiteSignalContactChannels,
} from '../types';

/**
 * Website Signal Extractor Implementation
 * 
 * Extracts structured signals from company websites.
 * This is a basic implementation - full crawling depth is UNDEFINED.
 */
export class WebsiteSignalExtractor implements IWebsiteSignalExtractor {
  /**
   * Extract structured signals from a company website
   * 
   * This method fetches the website and extracts structured signals.
   * Note: Crawl depth is UNDEFINED - current implementation focuses on homepage.
   */
  async extractSignals(
    input: WebsiteSignalExtractionInput
  ): Promise<WebsiteSignalExtractionOutput> {
    try {
      // Fetch website content
      const response = await fetch(input.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CCS Lead Agent Discovery Bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        // UNDEFINED: timeout, retry strategy, etc.
      });

      if (!response.ok) {
        return {
          sourceUrl: input.url,
          signals: {},
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const html = await response.text();

      // Extract all signals from HTML
      const signals: WebsiteSignals = {
        services: this.extractServicesFromHTML(html, input.companyName),
        industries: this.extractIndustriesFromHTML(html, input.companyName),
        locations: this.extractLocationsFromHTML(html),
        contactChannels: this.extractContactChannelsFromHTML(html),
      };

      // Remove empty signal categories
      const cleanedSignals: WebsiteSignals = {};
      if (signals.services && signals.services.services.length > 0) {
        cleanedSignals.services = signals.services;
      }
      if (signals.industries && signals.industries.industries.length > 0) {
        cleanedSignals.industries = signals.industries;
      }
      if (signals.locations && signals.locations.locations.length > 0) {
        cleanedSignals.locations = signals.locations;
      }
      if (
        signals.contactChannels &&
        (signals.contactChannels.emails.length > 0 ||
          signals.contactChannels.phones.length > 0 ||
          signals.contactChannels.contactForms?.length)
      ) {
        cleanedSignals.contactChannels = signals.contactChannels;
      }

      return {
        sourceUrl: input.url,
        signals: cleanedSignals,
        success: true,
      };
    } catch (error: any) {
      return {
        sourceUrl: input.url,
        signals: {},
        success: false,
        error: error.message || 'Unknown error occurred during signal extraction',
      };
    }
  }

  /**
   * Extract services from already extracted signals
   */
  extractServices(signals: WebsiteSignals): WebsiteSignals['services'] {
    return signals.services;
  }

  /**
   * Extract industries from already extracted signals
   */
  extractIndustries(signals: WebsiteSignals): WebsiteSignals['industries'] {
    return signals.industries;
  }

  /**
   * Extract locations from already extracted signals
   */
  extractLocations(signals: WebsiteSignals): WebsiteSignals['locations'] {
    return signals.locations;
  }

  /**
   * Extract contact channels from already extracted signals
   */
  extractContactChannels(
    signals: WebsiteSignals
  ): WebsiteSignals['contactChannels'] {
    return signals.contactChannels;
  }

  /**
   * Extract services offered from HTML content
   */
  private extractServicesFromHTML(
    html: string,
    companyName?: string
  ): WebsiteSignalServices | undefined {
    const services: string[] = [];
    const htmlLower = html.toLowerCase();

    // Common service section patterns
    const servicePatterns = [
      /<h[2-6][^>]*>.*?(?:services?|what we do|our services?|offerings?|solutions?|products?|solutions?)[^<]*<\/h[2-6]>/gi,
      /class=["'][^"']*service[^"']*["'][^>]*>/gi,
      /id=["'][^"']*service[^"']*["'][^>]*>/gi,
    ];

    // Try to find service sections
    let serviceSection = '';
    for (const pattern of servicePatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Extract content after service header
        const headerIndex = htmlLower.indexOf(matches[0].toLowerCase());
        if (headerIndex >= 0) {
          serviceSection = html.substring(headerIndex, headerIndex + 2000); // Get next 2000 chars
          break;
        }
      }
    }

    // If no service section found, search entire HTML
    const searchText = serviceSection || html;
    const searchLower = searchText.toLowerCase();

    // Look for list items that might be services
    const listItemPattern = /<li[^>]*>(.*?)<\/li>/gi;
    let match;
    while ((match = listItemPattern.exec(searchText)) !== null) {
      const text = this.stripHTML(match[1]).trim();
      if (text.length > 10 && text.length < 200) {
        // Exclude navigation items
        const lowerText = text.toLowerCase();
        if (
          !lowerText.includes('home') &&
          !lowerText.includes('about') &&
          !lowerText.includes('contact') &&
          !lowerText.includes('privacy') &&
          !lowerText.includes('terms') &&
          !lowerText.includes('cookie')
        ) {
          services.push(text);
        }
      }
    }

    // Also look for services in paragraphs after service headers
    const paragraphPattern = /<p[^>]*>(.*?)<\/p>/gi;
    let paraMatch;
    while ((paraMatch = paragraphPattern.exec(searchText)) !== null && services.length < 10) {
      const text = this.stripHTML(paraMatch[1]).trim();
      if (text.length > 20 && text.length < 300) {
        services.push(text);
      }
    }

    // Limit to first 10 services
    const uniqueServices = Array.from(new Set(services)).slice(0, 10);

    if (uniqueServices.length === 0) {
      return undefined;
    }

    return {
      services: uniqueServices,
    };
  }

  /**
   * Extract industries served from HTML content
   */
  private extractIndustriesFromHTML(
    html: string,
    companyName?: string
  ): WebsiteSignalIndustries | undefined {
    const industries: string[] = [];
    const htmlLower = html.toLowerCase();

    // Common industry keywords
    const industryKeywords: Record<string, string[]> = {
      'Technology': ['technology', 'software', 'tech', 'digital', 'it', 'cloud'],
      'Healthcare': ['healthcare', 'medical', 'hospital', 'health', 'pharmaceutical'],
      'Finance': ['finance', 'banking', 'financial', 'insurance', 'fintech'],
      'Manufacturing': ['manufacturing', 'production', 'industrial'],
      'Retail': ['retail', 'retailer', 'store', 'shop'],
      'Education': ['education', 'school', 'university', 'training'],
      'Hospitality': ['hospitality', 'hotel', 'restaurant', 'catering'],
      'Event Management': ['event', 'events', 'conference', 'venue'],
      'Marketing': ['marketing', 'advertising', 'agency'],
      'Consulting': ['consulting', 'advisory', 'consultant'],
    };

    // Look for industry mentions
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some((keyword) => htmlLower.includes(keyword))) {
        industries.push(industry);
      }
    }

    // Also look for industry section
    const industryPatterns = [
      /<h[2-6][^>]*>.*?(?:industries?|sectors?|markets?)[^<]*<\/h[2-6]>/gi,
      /class=["'][^"']*industry[^"']*["'][^>]*>/gi,
    ];

    for (const pattern of industryPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        const headerIndex = htmlLower.indexOf(matches[0].toLowerCase());
        if (headerIndex >= 0) {
          const section = html.substring(headerIndex, headerIndex + 2000);
          // Extract list items from industry section
          const listItemPattern = /<li[^>]*>(.*?)<\/li>/gi;
          let match;
          while ((match = listItemPattern.exec(section)) !== null) {
            const text = this.stripHTML(match[1]).trim();
            if (text && text.length < 100) {
              industries.push(text);
            }
          }
        }
        break;
      }
    }

    const uniqueIndustries = Array.from(new Set(industries));

    if (uniqueIndustries.length === 0) {
      return undefined;
    }

    return {
      industries: uniqueIndustries,
    };
  }

  /**
   * Extract locations from HTML content
   */
  private extractLocationsFromHTML(html: string): WebsiteSignalLocations | undefined {
    const locations: string[] = [];
    const addresses: string[] = [];

    // Look for address patterns
    const addressPatterns = [
      /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|parkway|pkwy)\b[^<]*/gi,
      /\b(?:p\.?o\.?\s*box|po box)\s+\d+[^<]*/gi, // PO Box
    ];

    for (const pattern of addressPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        addresses.push(...matches.map((m) => m.trim()));
      }
    }

    // Look for city, state patterns
    const cityStatePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/g;
    let match;
    while ((match = cityStatePattern.exec(html)) !== null) {
      locations.push(`${match[1]}, ${match[2]}`);
    }

    // Look for country mentions
    const countryPattern = /\b(?:United States|USA|UK|United Kingdom|Canada|Australia|Germany|France|Italy|Spain|Netherlands|Belgium|Switzerland|Sweden|Norway|Denmark|Japan|China|India|Brazil|Mexico)\b/gi;
    const countryMatches = html.match(countryPattern);
    if (countryMatches) {
      locations.push(...Array.from(new Set(countryMatches)));
    }

    // Look for location section
    const locationPatterns = [
      /<h[2-6][^>]*>.*?(?:locations?|offices?|where we are|contact)[^<]*<\/h[2-6]>/gi,
      /class=["'][^"']*location[^"']*["'][^>]*>/gi,
    ];

    for (const pattern of locationPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        const htmlLower = html.toLowerCase();
        const headerIndex = htmlLower.indexOf(matches[0].toLowerCase());
        if (headerIndex >= 0) {
          const section = html.substring(headerIndex, headerIndex + 2000);
          // Extract location mentions from section
          const cityMatches = section.match(cityStatePattern);
          if (cityMatches) {
            locations.push(...cityMatches);
          }
        }
        break;
      }
    }

    const uniqueLocations = Array.from(new Set(locations));
    const uniqueAddresses = Array.from(new Set(addresses));

    if (uniqueLocations.length === 0 && uniqueAddresses.length === 0) {
      return undefined;
    }

    return {
      locations: uniqueLocations,
      addresses: uniqueAddresses.length > 0 ? uniqueAddresses : undefined,
    };
  }

  /**
   * Extract contact channels from HTML content
   */
  private extractContactChannelsFromHTML(
    html: string
  ): WebsiteSignalContactChannels | undefined {
    const emails: string[] = [];
    const phones: string[] = [];
    const contactForms: Array<{ url?: string; presence?: boolean }> = [];

    // Extract email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = html.match(emailPattern);
    if (emailMatches) {
      // Filter out common non-contact emails
      const filtered = emailMatches.filter(
        (email) =>
          !email.includes('example.com') &&
          !email.includes('test.com') &&
          !email.includes('placeholder') &&
          !email.includes('your-email') &&
          !email.includes('@cdn.') &&
          !email.includes('@s3.')
      );
      emails.push(...Array.from(new Set(filtered)));
    }

    // Extract phone numbers
    const phonePatterns = [
      /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // US format
      /\b(?:\+44[-.\s]?)?\(?0\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g, // UK format
      /\b(?:\+?[\d\s\-\(\)]{10,})\b/g, // Generic international
    ];

    for (const pattern of phonePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        phones.push(...matches.map((p) => p.trim()));
      }
    }

    // Look for contact forms
    const contactFormPatterns = [
      /<form[^>]*class=["'][^"']*contact[^"']*["'][^>]*>/gi,
      /<form[^>]*id=["'][^"']*contact[^"']*["'][^>]*>/gi,
      /action=["']([^"']*contact[^"']*)["']/gi,
    ];

    for (const pattern of contactFormPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        contactForms.push({ presence: true });
        break;
      }
    }

    // Limit results
    const uniqueEmails = Array.from(new Set(emails)).slice(0, 5);
    const uniquePhones = Array.from(new Set(phones)).slice(0, 5);

    if (
      uniqueEmails.length === 0 &&
      uniquePhones.length === 0 &&
      contactForms.length === 0
    ) {
      return undefined;
    }

    return {
      emails: uniqueEmails,
      phones: uniquePhones,
      contactForms: contactForms.length > 0 ? contactForms : undefined,
    };
  }

  /**
   * Strip HTML tags from text
   */
  private stripHTML(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&[a-z]+;/gi, ' ') // Replace other HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}
