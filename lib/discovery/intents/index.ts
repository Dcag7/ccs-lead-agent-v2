/**
 * Phase 5A - Discovery Intents Public Exports
 */

// Types
export type {
  DiscoveryIntent,
  DiscoveryChannel,
  CountryCode,
  IntentOverrides,
  ResolvedIntentConfig,
  ManualDiscoveryRequest,
  ManualDiscoveryResponse,
  IntentCategory,
  GeographyConfig,
} from './types';

// Catalog - New intents
export {
  AGENCIES_ALL,
  SCHOOLS_ALL,
  TENDERS_UNIFORMS_MERCH,
  BUSINESSES_SME_CEO_AND_CORPORATE_MARKETING,
} from './catalog';

// Catalog - Legacy intents (for backward compatibility)
export {
  INTENT_CATALOG,
  REFERRAL_ECOSYSTEM_PROSPECTS,
  AGENCIES_MARKETING_BRANDING,
  CORPORATE_UNIFORMS_WORKWEAR_BUYERS,
  EVENTS_CONFERENCES_EXPOS,
  getIntentById,
  getActiveIntents,
  getIntentsByCategory,
  getAnalysisConfigForIntent,
  COUNTRY_NAMES,
} from './catalog';

// New exports for Gauteng-first and global keywords
export {
  GLOBAL_NEGATIVE_KEYWORDS,
  GAUTENG_PRIORITY_REGIONS,
  ZA_GAUTENG_FIRST_GEOGRAPHY,
  DEFAULT_DAILY_INTENTS,
  hasGautengPriorityRegion,
  getGautengBoostScore,
} from './catalog';

// Apply Intent
export { applyIntent, applyIntentById, validateIntentId } from './applyIntent';
