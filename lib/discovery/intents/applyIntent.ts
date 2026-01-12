/**
 * Phase 5A - Apply Intent Configuration
 *
 * Deterministically applies an intent template to runner configuration,
 * merging with user-provided overrides.
 */

import type {
  DiscoveryIntent,
  IntentOverrides,
  ResolvedIntentConfig,
  CountryCode,
} from './types';
import { getIntentById, COUNTRY_NAMES } from './catalog';

/**
 * Default limits if not specified in intent or overrides
 * 
 * Conservative limits to conserve API quota:
 * - Google CSE free tier: 100 queries/day
 * - Each query may scrape up to 10 sites
 */
const DEFAULT_LIMITS = {
  maxLeads: 10,      // Max 10 leads per run
  maxCompanies: 10,  // Max 10 companies per run
  maxQueries: 3,     // Max 3 queries per run
  timeBudgetMs: 120000, // 2 minutes
};

/**
 * Apply user overrides to an intent, producing a resolved configuration
 */
export function applyIntent(
  intent: DiscoveryIntent,
  overrides?: IntentOverrides
): ResolvedIntentConfig {
  // 1. Resolve target countries
  const targetCountries: CountryCode[] =
    overrides?.targetCountries && overrides.targetCountries.length > 0
      ? overrides.targetCountries
      : intent.targetCountries;

  // 2. Build queries with country substitution
  const queries = buildQueriesWithCountries(intent.seedQueries, targetCountries);

  // 3. Merge include keywords
  const includeKeywords = [
    ...intent.includeKeywords,
    ...(overrides?.additionalIncludeKeywords || []),
  ];

  // 4. Merge exclude keywords
  const excludeKeywords = [
    ...intent.excludeKeywords,
    ...(overrides?.additionalExcludeKeywords || []),
  ];

  // 5. Resolve channels
  const channels =
    overrides?.channels && overrides.channels.length > 0
      ? overrides.channels
      : intent.channels;

  // 6. Merge limits (override > intent > defaults)
  const limits = {
    maxLeads:
      overrides?.limits?.maxLeads ??
      intent.limits?.maxLeads ??
      DEFAULT_LIMITS.maxLeads,
    maxCompanies:
      overrides?.limits?.maxCompanies ??
      intent.limits?.maxCompanies ??
      DEFAULT_LIMITS.maxCompanies,
    maxQueries:
      overrides?.limits?.maxQueries ??
      intent.limits?.maxQueries ??
      DEFAULT_LIMITS.maxQueries,
    timeBudgetMs:
      overrides?.limits?.timeBudgetMs ??
      intent.limits?.timeBudgetMs ??
      DEFAULT_LIMITS.timeBudgetMs,
  };

  return {
    intentId: intent.id,
    intentName: intent.name,
    targetCountries,
    queries,
    includeKeywords,
    excludeKeywords,
    channels,
    limits,
  };
}

/**
 * Apply intent by ID with optional overrides
 * Returns null if intent not found
 */
export function applyIntentById(
  intentId: string,
  overrides?: IntentOverrides
): ResolvedIntentConfig | null {
  const intent = getIntentById(intentId);
  if (!intent) {
    return null;
  }
  return applyIntent(intent, overrides);
}

/**
 * Build queries by substituting {country} placeholder with actual country names
 */
function buildQueriesWithCountries(
  seedQueries: string[],
  countries: CountryCode[]
): string[] {
  const queries: string[] = [];

  for (const query of seedQueries) {
    if (query.includes('{country}')) {
      // Substitute with each country
      for (const countryCode of countries) {
        const countryName = COUNTRY_NAMES[countryCode] || countryCode;
        queries.push(query.replace('{country}', countryName));
      }
    } else {
      // No substitution needed
      queries.push(query);
    }
  }

  return queries;
}

/**
 * Validate that an intent ID exists and is active
 */
export function validateIntentId(intentId: string): {
  valid: boolean;
  error?: string;
} {
  const intent = getIntentById(intentId);

  if (!intent) {
    return {
      valid: false,
      error: `Intent "${intentId}" not found`,
    };
  }

  if (!intent.active) {
    return {
      valid: false,
      error: `Intent "${intentId}" is not active`,
    };
  }

  return { valid: true };
}
