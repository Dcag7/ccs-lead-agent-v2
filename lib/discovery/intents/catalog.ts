/**
 * Phase 5A - Discovery Intent Catalog
 *
 * Code-first templates for different discovery strategies.
 * Each intent targets a specific type of prospect for CCS Apparel.
 * 
 * Business Context (CCS Apparel targets):
 * - Marketing/branding/event agencies
 * - Schools (uniforms/embroidery)
 * - SMEs and corporates (CEO/Marketing Manager/Procurement)
 * - Government tenders/RFQs
 * - Hotels and hospitality
 * 
 * Geography: South Africa only, Gauteng-first bias (not exclusion)
 */

import type { DiscoveryIntent, IntentCategory } from './types';
import type { AnalysisConfig } from '../scraper';

// ============================================================================
// GLOBAL EXCLUSIONS - Applied to ALL intents
// ============================================================================

/**
 * Global negative keywords to exclude job/vacancy/retail pollution
 * These are applied to every intent automatically
 */
export const GLOBAL_NEGATIVE_KEYWORDS = [
  // Job-related pollution
  'jobs',
  'job posting',
  'vacancies',
  'vacancy',
  'internship',
  'internships',
  'careers',
  'career',
  'we are hiring',
  'apply now',
  'recruitment',
  'job opportunity',
  'employment',
  'hiring',
  'linkedin.com/jobs',
  'indeed.com',
  'glassdoor',
  'jobsza',
  'pnet.co.za',
  'careers24',
  
  // Retail pollution (consumer-facing, not B2B)
  'retail store',
  'online shop',
  'buy online',
  'add to cart',
  'shopping cart',
  'checkout',
  'free shipping',
  'customer reviews',
  
  // List/directory articles (not company websites)
  'top 10',
  'top 20',
  'top 50',
  'top 100',
  'best agencies',
  'list of',
  'directory of',
  'wikipedia.org',
  'what is',
  'how to choose',
  'vs ',
  'versus',
];

// ============================================================================
// GAUTENG PRIORITY REGIONS - For Gauteng-first scoring bias
// ============================================================================

/**
 * Priority regions for Gauteng-first discovery
 * These locations get a scoring boost when detected
 */
export const GAUTENG_PRIORITY_REGIONS = [
  'Gauteng',
  'Johannesburg',
  'Pretoria',
  'Sandton',
  'Midrand',
  'Centurion',
  'Randburg',
  'Rosebank',
  'Bryanston',
  'Fourways',
  'Roodepoort',
  'Boksburg',
  'Kempton Park',
  'Germiston',
  'Alberton',
  'Edenvale',
];

/**
 * Default geography config for South Africa with Gauteng bias
 */
export const ZA_GAUTENG_FIRST_GEOGRAPHY = {
  primaryCountry: 'ZA' as const,
  priorityRegions: GAUTENG_PRIORITY_REGIONS,
  regionBoost: 0.15, // 15% boost for Gauteng mentions
};

// ============================================================================
// INTENT DEFINITIONS
// ============================================================================

/**
 * Agencies All - Marketing, Branding, Creative, Event Agencies
 * 
 * Target: Marketing/branding/creative agencies in South Africa (Gauteng bias).
 * These agencies buy branded apparel for client campaigns and activations.
 */
export const AGENCIES_ALL: DiscoveryIntent = {
  id: 'agencies_all',
  name: 'Agencies (Marketing/Branding/Creative)',
  description:
    'Marketing, branding, creative, and activation agencies that need branded apparel for client campaigns. Includes BTL, experiential, and promotional agencies.',
  targetCountries: ['ZA'],
  geography: ZA_GAUTENG_FIRST_GEOGRAPHY,
  seedQueries: [
    'marketing agency Gauteng South Africa',
    'branding agency Johannesburg',
    'creative agency Pretoria',
    'digital marketing agency Gauteng',
    'BTL agency South Africa',
    'experiential marketing agency Johannesburg',
    'brand activation agency Gauteng',
    'promotional marketing agency South Africa',
    'advertising agency Johannesburg Pretoria',
    'event marketing agency Gauteng',
  ],
  includeKeywords: [
    'marketing',
    'branding',
    'creative',
    'advertising',
    'activation',
    'experiential',
    'campaign',
    'corporate',
    'merchandise',
    'apparel',
    'uniform',
    'promotional',
    'btl',
    'atl',
    'agency',
    'client portfolio',
    'our clients',
    'case studies',
  ],
  excludeKeywords: [
    ...GLOBAL_NEGATIVE_KEYWORDS,
    // Education/training (not agency services)
    'course',
    'training',
    'university',
    'college',
    'learn marketing',
    'marketing degree',
    // Non-agency businesses
    'logistics company',
    'shipping company',
    'mining company',
    'oil company',
    'petroleum',
    'insurance company',
    'law firm',
    'accounting firm',
    'construction company',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 10,
    maxLeads: 10,
    maxQueries: 3,
    timeBudgetMs: 120000,
  },
  category: 'agency',
  active: true,
};

/**
 * Schools All - School Uniform Suppliers
 * 
 * Target: Schools that buy uniforms, embroidery, and sports apparel.
 */
export const SCHOOLS_ALL: DiscoveryIntent = {
  id: 'schools_all',
  name: 'Schools (Uniforms/Embroidery)',
  description:
    'Schools and educational institutions that purchase school uniforms, embroidered items, and sports kits.',
  targetCountries: ['ZA'],
  geography: ZA_GAUTENG_FIRST_GEOGRAPHY,
  seedQueries: [
    'school uniform supplier Gauteng',
    'embroidery school uniforms Johannesburg',
    'sports kit supplier schools Gauteng',
    'school uniforms Pretoria',
    'school embroidery supplier South Africa',
    'school sports wear Johannesburg',
    'private school uniforms Gauteng',
    'school blazer supplier South Africa',
  ],
  includeKeywords: [
    'school',
    'uniform',
    'embroidery',
    'sports kit',
    'supplier',
    'apparel',
    'blazer',
    'sports wear',
    'tracksuits',
    'school clothing',
    'educational',
    'academy',
    'college',
    'high school',
    'primary school',
  ],
  excludeKeywords: [
    ...GLOBAL_NEGATIVE_KEYWORDS,
    'retail store',
    'online shop',
    'second hand',
    'used uniforms',
    'uniform rental',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 10,
    maxLeads: 10,
    maxQueries: 3,
    timeBudgetMs: 120000,
  },
  category: 'schools',
  active: true,
};

/**
 * Tenders - Uniforms, Merch, PPE via eTenders Portal
 * 
 * Target: Government tenders/RFQs for uniforms, PPE, corporate clothing,
 * promotional items, embroidery/printing.
 * 
 * Uses site:etenders.gov.za to focus on National Treasury eTender Publication Portal
 */
export const TENDERS_UNIFORMS_MERCH: DiscoveryIntent = {
  id: 'tenders_uniforms_merch',
  name: 'Government Tenders (Uniforms/PPE/Merch)',
  description:
    'Government tenders and RFQs for uniforms, PPE, corporate clothing, promotional items, and embroidery/printing. Sources from National Treasury eTender Publication Portal (etenders.gov.za).',
  targetCountries: ['ZA'],
  geography: ZA_GAUTENG_FIRST_GEOGRAPHY,
  seedQueries: [
    // Primary: eTenders portal site-specific queries
    'site:etenders.gov.za uniform',
    'site:etenders.gov.za "corporate clothing"',
    'site:etenders.gov.za PPE',
    'site:etenders.gov.za "promotional items"',
    'site:etenders.gov.za workwear',
    'site:etenders.gov.za embroidery',
    'site:etenders.gov.za "protective clothing"',
    // Fallback: general tender searches
    'government tender uniform supply South Africa',
    'RFQ corporate clothing Gauteng',
  ],
  includeKeywords: [
    'tender',
    'rfq',
    'rfp',
    'bid',
    'supply',
    'uniforms',
    'corporate clothing',
    'ppe',
    'embroidery',
    'printing',
    'promotional items',
    'workwear',
    'protective clothing',
    'government',
    'municipality',
    'department',
    'closing date',
    'quotation',
    'procurement',
  ],
  excludeKeywords: [
    ...GLOBAL_NEGATIVE_KEYWORDS,
    // Non-apparel tenders
    'construction tender',
    'building tender',
    'software tender',
    'IT tender',
    'IT services',
    'consulting services',
    'audit services',
    'legal services',
    'catering tender',
    'transport tender',
    'vehicle tender',
    'stationery tender',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 10,
    maxLeads: 10,
    maxQueries: 5,  // More queries for tender sourcing
    timeBudgetMs: 120000,
  },
  category: 'tenders',
  active: true,
};

/**
 * Businesses - SME CEOs and Corporate Marketing
 * 
 * Target: SMEs (CEO/Owner) and corporates (Marketing Manager/Procurement)
 * who buy uniforms, workwear, promotional merchandise.
 */
export const BUSINESSES_SME_CEO_AND_CORPORATE_MARKETING: DiscoveryIntent = {
  id: 'businesses_sme_ceo_and_corporate_marketing',
  name: 'Businesses (SME & Corporate Buyers)',
  description:
    'SME business owners and corporate marketing/procurement managers who purchase uniforms, workwear, and promotional merchandise for their companies.',
  targetCountries: ['ZA'],
  geography: ZA_GAUTENG_FIRST_GEOGRAPHY,
  seedQueries: [
    'corporate gifts supplier Gauteng',
    'company uniforms supplier Johannesburg',
    'workwear supplier Pretoria',
    'promotional clothing supplier Gauteng',
    'corporate apparel South Africa',
    'branded workwear Johannesburg',
    'corporate merchandise supplier Gauteng',
    'company branding clothing Pretoria',
    'staff uniforms supplier South Africa',
    'promotional merchandise Gauteng',
  ],
  includeKeywords: [
    'procurement',
    'marketing',
    'corporate gifts',
    'uniforms',
    'workwear',
    'ppe',
    'branding',
    'embroidered',
    'printed',
    'supplier',
    'corporate apparel',
    'staff clothing',
    'company uniform',
    'branded merchandise',
    'promotional products',
  ],
  excludeKeywords: [
    ...GLOBAL_NEGATIVE_KEYWORDS,
    'wholesale retail',
    'retail only',
    'consumer',
    'fashion retail',
    'clothing store',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 10,
    maxLeads: 10,
    maxQueries: 3,
    timeBudgetMs: 120000,
  },
  category: 'business',
  active: true,
};

/**
 * Events & Exhibitions (SA) - Exhibitors, Sponsors, Event Organizers
 * 
 * Target: Companies that run events OR companies listed as exhibitors/sponsors/partners
 * for upcoming events where they need branded merch, uniforms, promotional items.
 * 
 * Focus: Event organizers, exhibition companies, conference sponsors, golf day organizers,
 * brand activation events, trade shows, corporate events.
 */
export const EVENTS_EXHIBITIONS_SA: DiscoveryIntent = {
  id: 'events_exhibitions_sa',
  name: 'Exhibitions & Events (SA)',
  description:
    'Event organizers, exhibition companies, and companies listed as exhibitors/sponsors/partners for upcoming events where they need branded merchandise, uniforms, and promotional items.',
  targetCountries: ['ZA'],
  geography: ZA_GAUTENG_FIRST_GEOGRAPHY,
  seedQueries: [
    'site:.za exhibition exhibitors list branded merchandise',
    'Gauteng expo exhibitors list sponsors',
    'conference sponsors South Africa branded apparel',
    'golf day corporate event sponsors branded caps shirts',
    'trade show exhibitors Gauteng branded merchandise',
    'exhibition sponsors Johannesburg promotional items',
    'corporate event organizers South Africa branded apparel',
    'brand activation events Gauteng branded merchandise',
    'expo sponsors Pretoria branded caps shirts',
    'conference exhibitors South Africa promotional items',
  ],
  includeKeywords: [
    'exhibitors',
    'exhibitor',
    'sponsors',
    'sponsor',
    'partners',
    'partner',
    'activation',
    'brand activation',
    'conference',
    'expo',
    'exhibition',
    'trade show',
    'golf day',
    'corporate event',
    'event organizer',
    'event management',
    'event company',
    'exhibition company',
    'conference organizer',
    'branded merchandise',
    'promotional items',
    'branded apparel',
    'branded caps',
    'branded shirts',
    'event merchandise',
    'exhibition merchandise',
    'sponsor merchandise',
  ],
  excludeKeywords: [
    ...GLOBAL_NEGATIVE_KEYWORDS,
    // Exclude non-relevant event types
    'wedding',
    'birthday party',
    'private party',
    'personal event',
    'consumer event',
    'retail event',
    // Exclude job-related
    'event coordinator job',
    'event manager vacancy',
    'event planning course',
    'event management degree',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 10,
    maxLeads: 10,
    maxQueries: 3,
    timeBudgetMs: 120000,
  },
  category: 'event',
  active: true,
};

// ============================================================================
// LEGACY INTENTS (kept for backward compatibility)
// ============================================================================

/**
 * Referral Ecosystem Prospects (Legacy)
 * 
 * Targets directories, associations, and referral networks that could
 * recommend CCS Apparel as a supplier.
 */
export const REFERRAL_ECOSYSTEM_PROSPECTS: DiscoveryIntent = {
  id: 'referral_ecosystem_prospects',
  name: 'Referral Ecosystem Prospects',
  description:
    'Directories, associations, and referral networks (preferred suppliers, approved vendors, tender panels)',
  targetCountries: ['ZA', 'BW'],
  seedQueries: [
    'preferred supplier list corporate clothing {country}',
    'approved vendor uniform suppliers {country}',
    'tender supplier panel workwear {country}',
    'business directory corporate apparel {country}',
    'industry association uniform manufacturers {country}',
    'chamber of commerce suppliers clothing {country}',
    'procurement portal corporate wear {country}',
    'B-BBEE supplier database clothing {country}',
    'government supplier list uniforms {country}',
    'vendor registration corporate clothing {country}',
  ],
  includeKeywords: [
    'preferred supplier',
    'approved vendor',
    'panel',
    'tender',
    'supplier list',
    'directory',
    'association',
    'chamber',
    'procurement',
    'vendor registration',
    'B-BBEE',
    'supplier database',
  ],
  excludeKeywords: GLOBAL_NEGATIVE_KEYWORDS,
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 10,
    maxLeads: 10,
    maxQueries: 3,
    timeBudgetMs: 120000,
  },
  category: 'referral',
  active: true,
};

/**
 * Agencies - Marketing & Branding (Legacy - use agencies_all instead)
 */
export const AGENCIES_MARKETING_BRANDING: DiscoveryIntent = {
  id: 'agencies_marketing_branding',
  name: 'Marketing & Branding Agencies (Legacy)',
  description:
    'Creative, branding, and activation agencies that need branded apparel for client campaigns',
  targetCountries: ['ZA', 'BW'],
  seedQueries: [
    'marketing agency {country}',
    'branding agency corporate {country}',
    'activation agency events {country}',
    'creative agency brand {country}',
    'BTL marketing agency {country}',
    'experiential marketing {country}',
    'promotional marketing agency {country}',
    'brand activation company {country}',
    'event marketing agency {country}',
    'advertising agency corporate {country}',
  ],
  includeKeywords: [],
  excludeKeywords: GLOBAL_NEGATIVE_KEYWORDS,
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 10,
    maxLeads: 10,
    maxQueries: 3,
    timeBudgetMs: 120000,
  },
  category: 'agency',
  active: false, // Deprecated - use agencies_all
};

/**
 * Corporate Uniforms & Workwear Buyers (Legacy)
 */
export const CORPORATE_UNIFORMS_WORKWEAR_BUYERS: DiscoveryIntent = {
  id: 'corporate_uniforms_workwear_buyers',
  name: 'Corporate Uniforms & Workwear Buyers',
  description:
    'Companies actively seeking corporate uniforms, workwear, and PPE suppliers',
  targetCountries: ['ZA', 'BW'],
  seedQueries: [
    'corporate uniform supplier {country}',
    'workwear manufacturer {country}',
    'PPE supplier {country}',
    'branded workwear {country}',
    'staff uniform company {country}',
    'industrial clothing supplier {country}',
    'safety wear manufacturer {country}',
    'hospitality uniforms {country}',
    'school uniforms manufacturer {country}',
    'medical scrubs supplier {country}',
    'construction workwear {country}',
    'security uniforms supplier {country}',
  ],
  includeKeywords: [
    'uniform',
    'workwear',
    'PPE',
    'corporate clothing',
    'branded apparel',
    'staff clothing',
    'industrial wear',
    'safety wear',
    'hospitality',
    'school uniform',
    'scrubs',
    'overalls',
  ],
  excludeKeywords: GLOBAL_NEGATIVE_KEYWORDS,
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 10,
    maxLeads: 10,
    maxQueries: 3,
    timeBudgetMs: 120000,
  },
  category: 'buyer',
  active: true,
};

/**
 * Events, Conferences & Expos (Legacy)
 */
export const EVENTS_CONFERENCES_EXPOS: DiscoveryIntent = {
  id: 'events_conferences_expos',
  name: 'Events, Conferences & Expos',
  description:
    'Event organizers, conference venues, and exhibition companies needing branded apparel',
  targetCountries: ['ZA', 'BW'],
  seedQueries: [
    'event management company {country}',
    'conference organizer {country}',
    'exhibition company {country}',
    'expo organizer {country}',
    'corporate events company {country}',
    'trade show organizer {country}',
    'conference venue {country}',
    'event planner corporate {country}',
    'MICE company {country}',
    'business events organizer {country}',
  ],
  includeKeywords: [
    'event',
    'conference',
    'exhibition',
    'expo',
    'trade show',
    'MICE',
    'corporate events',
    'venue',
    'organizer',
    'planner',
    'congress',
  ],
  excludeKeywords: [
    ...GLOBAL_NEGATIVE_KEYWORDS,
    'wedding',
    'birthday',
    'party planner',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 10,
    maxLeads: 10,
    maxQueries: 3,
    timeBudgetMs: 120000,
  },
  category: 'event',
  active: true,
};

// ============================================================================
// INTENT CATALOG
// ============================================================================

/**
 * All available intents (new intents first, legacy after)
 */
export const INTENT_CATALOG: DiscoveryIntent[] = [
  // New CCS-aligned intents (Gauteng-first)
  AGENCIES_ALL,
  SCHOOLS_ALL,
  TENDERS_UNIFORMS_MERCH,
  BUSINESSES_SME_CEO_AND_CORPORATE_MARKETING,
  EVENTS_EXHIBITIONS_SA,
  // Legacy intents (still available)
  REFERRAL_ECOSYSTEM_PROSPECTS,
  CORPORATE_UNIFORMS_WORKWEAR_BUYERS,
  EVENTS_CONFERENCES_EXPOS,
  // Deprecated (inactive)
  AGENCIES_MARKETING_BRANDING,
];

/**
 * Default intents for daily autonomous discovery
 * These run automatically via cron - conservative selection
 */
export const DEFAULT_DAILY_INTENTS = [
  'agencies_all',
  'tenders_uniforms_merch',
  'businesses_sme_ceo_and_corporate_marketing',
];

/**
 * Get intent by ID
 */
export function getIntentById(id: string): DiscoveryIntent | undefined {
  return INTENT_CATALOG.find((intent) => intent.id === id);
}

/**
 * Get all active intents
 */
export function getActiveIntents(): DiscoveryIntent[] {
  return INTENT_CATALOG.filter((intent) => intent.active);
}

/**
 * Get intents by category
 */
export function getIntentsByCategory(
  category: IntentCategory
): DiscoveryIntent[] {
  return INTENT_CATALOG.filter((intent) => intent.category === category);
}

/**
 * Country name mapping for query substitution
 */
export const COUNTRY_NAMES: Record<string, string> = {
  ZA: 'South Africa',
  BW: 'Botswana',
  NA: 'Namibia',
  MZ: 'Mozambique',
  ZW: 'Zimbabwe',
  KE: 'Kenya',
  NG: 'Nigeria',
  GH: 'Ghana',
};

// ============================================================================
// ANALYSIS CONFIG GENERATION
// ============================================================================

/**
 * Map intent category to target business types for content analysis
 */
const TARGET_BUSINESS_TYPES_BY_CATEGORY: Record<IntentCategory, string[]> = {
  agency: [
    'marketing agency', 'branding agency', 'creative agency',
    'advertising agency', 'activation agency', 'btl agency',
    'experiential agency', 'promotional agency', 'pr agency',
    'digital agency', 'media agency',
  ],
  event: [
    'event management', 'event company', 'conference organizer',
    'exhibition company', 'event planner', 'expo organizer',
    'exhibitor', 'sponsor', 'brand activation', 'trade show',
    'corporate event', 'golf day', 'exhibition',
  ],
  buyer: [
    'uniform supplier', 'workwear manufacturer', 'clothing supplier',
    'corporate apparel', 'ppe supplier',
  ],
  referral: [
    'supplier directory', 'business association', 'procurement',
    'vendor registration', 'supplier database',
  ],
  schools: [
    'school', 'academy', 'college', 'educational institution',
    'uniform supplier', 'school uniform',
  ],
  tenders: [
    'government department', 'municipality', 'state entity',
    'procurement office', 'tender portal',
  ],
  business: [
    'corporate', 'company', 'business', 'enterprise',
    'sme', 'small business', 'medium enterprise',
  ],
  custom: [],
};

/**
 * Generate AnalysisConfig from a DiscoveryIntent
 * 
 * This creates the configuration for web scraping and content analysis
 * based on the intent's keywords and category.
 * 
 * Includes Gauteng priority boost when geography is configured.
 */
export function getAnalysisConfigForIntent(intent: DiscoveryIntent): AnalysisConfig {
  // Use includeKeywords as positive keywords
  // Enhance with contextual business keywords
  const positiveKeywords = [
    ...intent.includeKeywords,
    // Add common business indicators if not already present
    'about us', 'our clients', 'our services', 'contact us', 'portfolio',
  ];

  // Build geography boost config if priority regions are defined
  const geographyBoost = intent.geography?.priorityRegions?.length
    ? {
        priorityRegions: intent.geography.priorityRegions,
        boostAmount: intent.geography.regionBoost ?? 0.15,
      }
    : undefined;

  return {
    positiveKeywords,
    negativeKeywords: intent.excludeKeywords,
    targetBusinessTypes: TARGET_BUSINESS_TYPES_BY_CATEGORY[intent.category] || [],
    relevanceThreshold: intent.category === 'tenders' ? 25 : 35, // Lower threshold for tenders
    geographyBoost,
  };
}

/**
 * Check if a location string contains a Gauteng priority region
 */
export function hasGautengPriorityRegion(text: string): boolean {
  const lowerText = text.toLowerCase();
  return GAUTENG_PRIORITY_REGIONS.some(region => 
    lowerText.includes(region.toLowerCase())
  );
}

/**
 * Get Gauteng boost score for a text (based on region mentions)
 */
export function getGautengBoostScore(text: string, boost: number = 0.15): number {
  if (!text) return 0;
  
  const lowerText = text.toLowerCase();
  const matchCount = GAUTENG_PRIORITY_REGIONS.filter(region => 
    lowerText.includes(region.toLowerCase())
  ).length;
  
  // Cap at 2x boost for multiple mentions
  return Math.min(matchCount * boost, boost * 2);
}
