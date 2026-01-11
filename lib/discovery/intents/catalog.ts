/**
 * Phase 5A - Discovery Intent Catalog
 *
 * Code-first templates for different discovery strategies.
 * Each intent targets a specific type of prospect for CCS Apparel.
 */

import type { DiscoveryIntent } from './types';

/**
 * Referral Ecosystem Prospects
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
  excludeKeywords: [
    'job posting',
    'career',
    'employment',
    'vacancy',
    'recruitment',
    'linkedin.com/jobs',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 50,
    maxQueries: 10,
    timeBudgetMs: 300000, // 5 minutes
  },
  category: 'referral',
  active: true,
};

/**
 * Agencies - Marketing & Branding
 *
 * Targets creative, branding, and activation agencies that may need
 * branded apparel for their clients' campaigns.
 */
export const AGENCIES_MARKETING_BRANDING: DiscoveryIntent = {
  id: 'agencies_marketing_branding',
  name: 'Marketing & Branding Agencies',
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
  includeKeywords: [
    'agency',
    'marketing',
    'branding',
    'activation',
    'creative',
    'BTL',
    'experiential',
    'promotional',
    'advertising',
    'brand',
    'campaign',
  ],
  excludeKeywords: [
    'job posting',
    'career',
    'employment',
    'vacancy',
    'recruitment',
    'linkedin.com/jobs',
    'digital only',
    'SEO only',
    'social media only',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 50,
    maxQueries: 10,
    timeBudgetMs: 300000,
  },
  category: 'agency',
  active: true,
};

/**
 * Corporate Uniforms & Workwear Buyers
 *
 * Targets companies that are actively looking for or using
 * corporate uniforms, workwear, and PPE.
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
  excludeKeywords: [
    'job posting',
    'career',
    'employment',
    'vacancy',
    'recruitment',
    'linkedin.com/jobs',
    'second hand',
    'used',
    'rental only',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 75,
    maxQueries: 12,
    timeBudgetMs: 360000, // 6 minutes
  },
  category: 'buyer',
  active: true,
};

/**
 * Events, Conferences & Expos
 *
 * Targets event organizers, conference venues, and exhibition companies
 * that need branded apparel for staff and participants.
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
    'job posting',
    'career',
    'employment',
    'vacancy',
    'recruitment',
    'linkedin.com/jobs',
    'wedding',
    'birthday',
    'party planner',
  ],
  channels: ['google', 'keyword'],
  limits: {
    maxCompanies: 40,
    maxQueries: 10,
    timeBudgetMs: 300000,
  },
  category: 'event',
  active: true,
};

/**
 * All available intents
 */
export const INTENT_CATALOG: DiscoveryIntent[] = [
  REFERRAL_ECOSYSTEM_PROSPECTS,
  AGENCIES_MARKETING_BRANDING,
  CORPORATE_UNIFORMS_WORKWEAR_BUYERS,
  EVENTS_CONFERENCES_EXPOS,
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
  category: DiscoveryIntent['category']
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
