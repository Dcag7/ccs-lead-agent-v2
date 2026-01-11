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
} from './types';

// Catalog
export {
  INTENT_CATALOG,
  REFERRAL_ECOSYSTEM_PROSPECTS,
  AGENCIES_MARKETING_BRANDING,
  CORPORATE_UNIFORMS_WORKWEAR_BUYERS,
  EVENTS_CONFERENCES_EXPOS,
  getIntentById,
  getActiveIntents,
  getIntentsByCategory,
  COUNTRY_NAMES,
} from './catalog';

// Apply Intent
export { applyIntent, applyIntentById, validateIntentId } from './applyIntent';
