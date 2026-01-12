/**
 * Content Analyzer for Discovery
 * 
 * Analyzes scraped website content to determine if a company
 * is relevant to a discovery intent.
 */

import type { ScrapedContent } from './WebScraper';

export interface RelevanceScore {
  /** Overall relevance score (0-100) */
  score: number;
  /** Whether the company passes the relevance threshold */
  isRelevant: boolean;
  /** Detailed breakdown of scoring */
  breakdown: {
    keywordScore: number;
    serviceScore: number;
    businessTypeScore: number;
    contentQualityScore: number;
  };
  /** Reasons why the company is/isn't relevant */
  reasons: string[];
  /** Extracted company type/industry */
  detectedIndustry?: string;
  /** Confidence level (low, medium, high) */
  confidence: 'low' | 'medium' | 'high';
}

export interface AnalysisConfig {
  /** Keywords that indicate relevance (positive signals) */
  positiveKeywords: string[];
  /** Keywords that indicate irrelevance (negative signals) */
  negativeKeywords: string[];
  /** Business types we're looking for */
  targetBusinessTypes: string[];
  /** Minimum score to be considered relevant (default: 40) */
  relevanceThreshold?: number;
  /** Geography boost configuration (for Gauteng-first etc.) */
  geographyBoost?: {
    /** Regions that get a score boost */
    priorityRegions: string[];
    /** Boost amount (0-1, default 0.15 = 15%) */
    boostAmount: number;
  };
}

/**
 * Content Analyzer class
 * 
 * Scores scraped content against a discovery intent configuration.
 */
export class ContentAnalyzer {
  /**
   * Analyze scraped content and determine relevance to an intent
   */
  analyze(content: ScrapedContent, config: AnalysisConfig): RelevanceScore {
    const threshold = config.relevanceThreshold ?? 40;
    const reasons: string[] = [];

    // If scraping failed, return low score
    if (!content.success || !content.textContent) {
      return {
        score: 0,
        isRelevant: false,
        breakdown: {
          keywordScore: 0,
          serviceScore: 0,
          businessTypeScore: 0,
          contentQualityScore: 0,
        },
        reasons: [content.error || 'No content available to analyze'],
        confidence: 'low',
      };
    }

    const text = (content.textContent || '').toLowerCase();
    const title = (content.title || '').toLowerCase();
    const description = (content.description || '').toLowerCase();
    const fullText = `${title} ${description} ${text}`;

    // 1. Keyword Score (0-30 points)
    const keywordScore = this.calculateKeywordScore(
      fullText,
      config.positiveKeywords,
      config.negativeKeywords,
      reasons
    );

    // 2. Service Score (0-25 points)
    const serviceScore = this.calculateServiceScore(
      content.services || [],
      fullText,
      config.targetBusinessTypes,
      reasons
    );

    // 3. Business Type Score (0-30 points)
    const businessTypeScore = this.calculateBusinessTypeScore(
      fullText,
      title,
      config.targetBusinessTypes,
      reasons
    );

    // 4. Content Quality Score (0-15 points)
    const contentQualityScore = this.calculateContentQualityScore(
      content,
      reasons
    );

    // 5. Geography Boost Score (0-15 points)
    const geographyBoostScore = this.calculateGeographyBoostScore(
      fullText,
      config.geographyBoost,
      reasons
    );

    // Calculate total score
    const totalScore = Math.round(
      keywordScore + serviceScore + businessTypeScore + contentQualityScore + geographyBoostScore
    );

    // Determine confidence based on content quality
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (content.textContent.length > 1000 && content.description) {
      confidence = 'high';
    } else if (content.textContent.length > 500 || content.description) {
      confidence = 'medium';
    }

    // Detect industry
    const detectedIndustry = this.detectIndustry(fullText);

    return {
      score: Math.min(100, totalScore),
      isRelevant: totalScore >= threshold,
      breakdown: {
        keywordScore,
        serviceScore,
        businessTypeScore,
        contentQualityScore,
      },
      reasons,
      detectedIndustry,
      confidence,
    };
  }

  /**
   * Calculate keyword-based relevance score
   */
  private calculateKeywordScore(
    text: string,
    positiveKeywords: string[],
    negativeKeywords: string[],
    reasons: string[]
  ): number {
    let score = 0;
    const matchedPositive: string[] = [];
    const matchedNegative: string[] = [];

    // Count positive keyword matches (up to +30 points)
    for (const keyword of positiveKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchedPositive.push(keyword);
        score += 5; // 5 points per positive keyword
      }
    }
    score = Math.min(score, 30); // Cap at 30

    // Subtract for negative keyword matches
    for (const keyword of negativeKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchedNegative.push(keyword);
        score -= 10; // -10 points per negative keyword
      }
    }

    if (matchedPositive.length > 0) {
      reasons.push(`Found relevant keywords: ${matchedPositive.slice(0, 5).join(', ')}`);
    }
    if (matchedNegative.length > 0) {
      reasons.push(`Found irrelevant indicators: ${matchedNegative.slice(0, 3).join(', ')}`);
    }

    return Math.max(0, score);
  }

  /**
   * Calculate service-based relevance score
   */
  private calculateServiceScore(
    services: string[],
    fullText: string,
    targetTypes: string[],
    reasons: string[]
  ): number {
    let score = 0;

    // Check for service-related content
    const serviceIndicators = [
      'our services', 'we offer', 'we provide', 'we specialize',
      'solutions', 'what we do', 'capabilities',
    ];

    for (const indicator of serviceIndicators) {
      if (fullText.includes(indicator)) {
        score += 3;
      }
    }

    // Check if services match target types
    const servicesText = services.join(' ').toLowerCase();
    for (const targetType of targetTypes) {
      if (servicesText.includes(targetType.toLowerCase()) || 
          fullText.includes(targetType.toLowerCase())) {
        score += 5;
      }
    }

    if (services.length > 0) {
      reasons.push(`Offers services: ${services.slice(0, 3).join('; ').substring(0, 100)}`);
    }

    return Math.min(25, score);
  }

  /**
   * Calculate business type score
   */
  private calculateBusinessTypeScore(
    fullText: string,
    title: string,
    targetTypes: string[],
    reasons: string[]
  ): number {
    let score = 0;
    const matchedTypes: string[] = [];

    // Business type patterns
    const businessPatterns = [
      { pattern: /\bagency\b/i, type: 'agency', score: 15 },
      { pattern: /\bagencies\b/i, type: 'agency', score: 15 },
      { pattern: /\bstudio\b/i, type: 'creative studio', score: 12 },
      { pattern: /\bconsultancy\b/i, type: 'consultancy', score: 12 },
      { pattern: /\bconsulting\b/i, type: 'consulting', score: 10 },
      { pattern: /\bfirm\b/i, type: 'professional firm', score: 8 },
      { pattern: /\bgroup\b/i, type: 'group', score: 5 },
    ];

    // Check title first (weighted higher)
    for (const { pattern, type, score: pts } of businessPatterns) {
      if (pattern.test(title)) {
        matchedTypes.push(type);
        score += pts;
        break; // Only count first match in title
      }
    }

    // Check full text for target types
    for (const targetType of targetTypes) {
      const regex = new RegExp(`\\b${targetType.toLowerCase()}\\b`, 'i');
      if (regex.test(fullText)) {
        score += 5;
        if (!matchedTypes.includes(targetType)) {
          matchedTypes.push(targetType);
        }
      }
    }

    // Extra points for clear business identity
    if (fullText.includes('about us') || fullText.includes('who we are')) {
      score += 3;
    }

    if (matchedTypes.length > 0) {
      reasons.push(`Identified as: ${matchedTypes.join(', ')}`);
    }

    return Math.min(30, score);
  }

  /**
   * Calculate content quality score
   */
  private calculateContentQualityScore(
    content: ScrapedContent,
    reasons: string[]
  ): number {
    let score = 0;

    // Has company name
    if (content.companyName) {
      score += 3;
    }

    // Has description
    if (content.description && content.description.length > 50) {
      score += 3;
    }

    // Has contact info
    if (content.contact) {
      if (content.contact.email) score += 2;
      if (content.contact.phone) score += 2;
      if (content.contact.address) score += 1;
      reasons.push('Has contact information');
    }

    // Has social media presence
    if (content.socialLinks) {
      const socialCount = Object.keys(content.socialLinks).length;
      score += Math.min(socialCount, 3);
      if (content.socialLinks.linkedin) {
        score += 2; // LinkedIn is valuable for B2B
        reasons.push('Has LinkedIn presence');
      }
    }

    // Content length indicates a real website
    if (content.textContent && content.textContent.length > 2000) {
      score += 2;
    }

    return Math.min(15, score);
  }

  /**
   * Calculate geography boost score based on priority region mentions
   */
  private calculateGeographyBoostScore(
    text: string,
    geographyBoost: AnalysisConfig['geographyBoost'],
    reasons: string[]
  ): number {
    if (!geographyBoost || !geographyBoost.priorityRegions.length) {
      return 0;
    }

    let score = 0;
    const matchedRegions: string[] = [];

    for (const region of geographyBoost.priorityRegions) {
      if (text.includes(region.toLowerCase())) {
        matchedRegions.push(region);
        score += 5; // 5 points per priority region match
      }
    }

    // Cap at 15 points for geography boost
    score = Math.min(15, score);

    if (matchedRegions.length > 0) {
      reasons.push(`Priority region match: ${matchedRegions.slice(0, 3).join(', ')}`);
    }

    return score;
  }

  /**
   * Detect likely industry from content
   */
  private detectIndustry(text: string): string | undefined {
    const industryPatterns: Array<{ keywords: string[]; industry: string }> = [
      { 
        keywords: ['marketing', 'advertising', 'branding', 'creative', 'campaign', 'btl', 'atl'],
        industry: 'Marketing & Advertising' 
      },
      { 
        keywords: ['pr', 'public relations', 'communications', 'media relations'],
        industry: 'Public Relations' 
      },
      { 
        keywords: ['events', 'exhibitions', 'conferences', 'experiential'],
        industry: 'Events & Exhibitions' 
      },
      { 
        keywords: ['design', 'graphic', 'visual', 'ux', 'ui', 'web design'],
        industry: 'Design' 
      },
      { 
        keywords: ['digital', 'technology', 'software', 'development', 'tech'],
        industry: 'Technology' 
      },
      { 
        keywords: ['logistics', 'shipping', 'freight', 'transport', 'delivery'],
        industry: 'Logistics' 
      },
      { 
        keywords: ['mining', 'minerals', 'extraction', 'resources'],
        industry: 'Mining' 
      },
      { 
        keywords: ['finance', 'banking', 'investment', 'insurance'],
        industry: 'Finance' 
      },
      { 
        keywords: ['manufacturing', 'factory', 'production', 'industrial'],
        industry: 'Manufacturing' 
      },
      { 
        keywords: ['retail', 'store', 'shop', 'ecommerce'],
        industry: 'Retail' 
      },
    ];

    let bestMatch: { industry: string; count: number } | null = null;

    for (const { keywords, industry } of industryPatterns) {
      let count = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          count++;
        }
      }
      if (count > 0 && (!bestMatch || count > bestMatch.count)) {
        bestMatch = { industry, count };
      }
    }

    return bestMatch?.industry;
  }

  /**
   * Create analysis config for Marketing & Branding Agencies intent
   */
  static createMarketingAgencyConfig(): AnalysisConfig {
    return {
      positiveKeywords: [
        // Business type
        'agency', 'agencies', 'studio', 'consultancy',
        // Services
        'marketing', 'branding', 'advertising', 'creative',
        'brand strategy', 'brand activation', 'experiential',
        'btl', 'atl', 'through the line', 'integrated marketing',
        'campaigns', 'promotions', 'events', 'activations',
        'digital marketing', 'social media marketing',
        'content creation', 'design', 'creative services',
        // Client indicators
        'our clients', 'client list', 'case studies', 'portfolio',
        'brands we work with', 'our work',
      ],
      negativeKeywords: [
        // Job sites
        'careers', 'job posting', 'vacancy', 'apply now', 'we are hiring',
        // Non-agency companies
        'logistics', 'shipping', 'freight', 'mining', 'oil and gas',
        'petroleum', 'banking', 'insurance', 'law firm',
        // List articles
        'top 10', 'top 20', 'best agencies', 'list of', 'directory',
        // Wikipedia/informational
        'wikipedia', 'from wikipedia',
      ],
      targetBusinessTypes: [
        'marketing agency', 'branding agency', 'creative agency',
        'advertising agency', 'activation agency', 'btl agency',
        'experiential agency', 'promotional agency', 'brand consultancy',
      ],
      relevanceThreshold: 35,
    };
  }

  /**
   * Create analysis config for Events & Conferences intent
   */
  static createEventsConfig(): AnalysisConfig {
    return {
      positiveKeywords: [
        'events', 'conferences', 'exhibitions', 'expo', 'trade show',
        'corporate events', 'event management', 'event planning',
        'venue', 'mice', 'congress', 'convention',
        'event organizer', 'event company',
      ],
      negativeKeywords: [
        'wedding', 'birthday', 'party planner',
        'careers', 'job posting', 'vacancy',
      ],
      targetBusinessTypes: [
        'event management', 'event company', 'conference organizer',
        'exhibition company', 'event planner',
      ],
      relevanceThreshold: 35,
    };
  }
}

// Singleton instance
export const contentAnalyzer = new ContentAnalyzer();
