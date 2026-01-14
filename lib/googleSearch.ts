/**
 * Google Custom Search Engine (CSE) Client
 * Phase 6: External Company Enrichment v1
 * 
 * This module provides on-demand Google search enrichment for companies.
 * Future extensions:
 * - Social media enrichment (LinkedIn, Twitter)
 * - Automated nightly enrichment runs
 * - Lead enrichment in addition to companies
 * - Advanced scoring using enrichment signals
 */

import { isConfigured, getConfigOrThrow } from './discovery/google/googleConfig';

interface GoogleSearchResult {
  success: boolean;
  configured: boolean;
  primaryUrl?: string;
  snippet?: string;
  rawItems?: Array<{
    title: string;
    link: string;
    snippet: string;
    displayLink?: string;
  }>;
  error?: string;
  metadata?: {
    totalResults?: string;
    searchTime?: number;
    formattedSearchTime?: string;
  };
}

interface GoogleCSEResponse {
  searchInformation?: {
    totalResults?: string;
    searchTime?: number;
    formattedSearchTime?: string;
  };
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
    displayLink?: string;
    formattedUrl?: string;
  }>;
}

/**
 * Search for a company using Google Custom Search Engine
 * 
 * @param name - Company name to search for
 * @param country - Optional country to refine search
 * @returns Normalized search result with primary URL, snippet, and raw items
 * 
 * FUTURE EXTENSION POINTS:
 * - Add industry-specific search refinements
 * - Integrate with social media APIs for richer data
 * - Cache results to reduce API quota usage
 * - Extract structured data (phone, address, employee count)
 */
export async function searchCompany(
  name: string,
  country?: string
): Promise<GoogleSearchResult> {
  // Check if Google CSE is configured (using centralized validation)
  if (!isConfigured()) {
    return {
      success: false,
      configured: false,
      error: 'Google Custom Search not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID environment variables.',
    };
  }

  try {
    // Get config (will not throw since we checked above)
    const config = getConfigOrThrow();

    // Build search query
    let searchQuery = `${name} company`;
    if (country) {
      searchQuery += ` ${country}`;
    }

    // Construct Google CSE API URL
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', config.apiKey);
    url.searchParams.set('cx', config.cseId);
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('num', '5'); // Limit to 5 results to save quota

    // Make API request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google CSE API error: ${response.status} - ${errorText}`);
    }

    const data: GoogleCSEResponse = await response.json();

    // Extract and normalize results
    const items = data.items || [];
    
    // Try to find the best primary URL (usually the first result)
    const primaryUrl = items.length > 0 ? items[0].link : undefined;
    const snippet = items.length > 0 ? items[0].snippet : undefined;

    // Return limited raw items to avoid storing too much data
    const rawItems = items.slice(0, 3).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
    }));

    return {
      success: true,
      configured: true,
      primaryUrl,
      snippet,
      rawItems,
      metadata: data.searchInformation
        ? {
            totalResults: data.searchInformation.totalResults,
            searchTime: data.searchInformation.searchTime,
            formattedSearchTime: data.searchInformation.formattedSearchTime,
          }
        : undefined,
    };
  } catch (error: unknown) {
    console.error('Google search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during Google search';
    return {
      success: false,
      configured: true,
      error: errorMessage,
    };
  }
}

/**
 * Validate if a URL is likely a legitimate company website
 * (Filters out social media profiles, directories, etc.)
 * 
 * FUTURE EXTENSION: Use more sophisticated URL validation
 */
export function isLikelyCompanyWebsite(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Filter out common non-company domains
    const excludedDomains = [
      'facebook.com',
      'linkedin.com',
      'twitter.com',
      'instagram.com',
      'youtube.com',
      'wikipedia.org',
      'bloomberg.com',
      'crunchbase.com',
      'yelp.com',
      'indeed.com',
      'glassdoor.com',
    ];

    return !excludedDomains.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Extract potential industry from search snippet using keywords
 * 
 * FUTURE EXTENSION: 
 * - Use NLP/ML for better industry classification
 * - Integrate with industry databases/APIs
 */
export function inferIndustryFromSnippet(snippet?: string): string | null {
  if (!snippet) return null;

  const snippetLower = snippet.toLowerCase();

  // Simple keyword-based industry detection
  const industryKeywords: Record<string, string[]> = {
    'Technology': ['software', 'tech', 'digital', 'it', 'cloud', 'saas', 'platform', 'app'],
    'Manufacturing': ['manufacturing', 'factory', 'production', 'industrial', 'machinery'],
    'Retail': ['retail', 'store', 'shop', 'ecommerce', 'e-commerce', 'online store'],
    'Finance': ['finance', 'banking', 'investment', 'financial', 'insurance', 'fintech'],
    'Healthcare': ['healthcare', 'medical', 'hospital', 'health', 'pharmaceutical', 'clinic'],
    'Consulting': ['consulting', 'advisory', 'professional services', 'consultant'],
    'Education': ['education', 'training', 'learning', 'school', 'university', 'academy'],
    'Real Estate': ['real estate', 'property', 'realty', 'housing'],
    'Logistics': ['logistics', 'shipping', 'transport', 'delivery', 'supply chain'],
    'Marketing': ['marketing', 'advertising', 'agency', 'branding', 'media'],
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some((keyword) => snippetLower.includes(keyword))) {
      return industry;
    }
  }

  return null;
}
