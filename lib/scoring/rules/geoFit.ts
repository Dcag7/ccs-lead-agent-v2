/**
 * Geographic fit scoring rules
 * 
 * Scores based on country allow-list/block-list:
 * - Country in allow-list: +points
 * - Country unknown: +0
 * - Country in block-list: -points
 */

import { ScoreFactor, ScoreInput } from '../types';

/**
 * Configurable country allow-list (preferred countries)
 * MUST be configurable constants as per requirements
 */
export const GEO_ALLOW_LIST = [
  'South Africa',
  'ZA',
  'Botswana',
  'BW',
  'Namibia',
  'NA',
  'Zimbabwe',
  'ZW',
];

/**
 * Configurable country block-list (excluded countries)
 * MUST be configurable constants as per requirements
 */
export const GEO_BLOCK_LIST: string[] = [
  // Add countries to exclude if needed
];

/**
 * Score for geographic fit factors
 */
export function scoreGeoFit(input: ScoreInput): ScoreFactor[] {
  const factors: ScoreFactor[] = [];
  
  // Get country from company or lead
  const country = input.company?.country || input.lead.country;
  
  if (!country) {
    // Unknown country: +0 (no factor added)
    return factors;
  }
  
  const countryLower = country.toLowerCase().trim();
  
  // Check block-list first (negative points)
  const isBlocked = GEO_BLOCK_LIST.some(
    blocked => countryLower === blocked.toLowerCase().trim()
  );
  
  if (isBlocked) {
    factors.push({
      name: 'country_blocked',
      points: -10,
      explanation: `Country ${country} is in block-list (-10)`,
    });
    return factors;
  }
  
  // Check allow-list (positive points)
  const isAllowed = GEO_ALLOW_LIST.some(
    allowed => countryLower === allowed.toLowerCase().trim()
  );
  
  if (isAllowed) {
    // Higher points for primary markets
    if (countryLower === 'south africa' || countryLower === 'za') {
      factors.push({
        name: 'country_allowed_primary',
        points: 15,
        explanation: `Country ${country} is in allow-list (primary market) (+15)`,
      });
    } else {
      factors.push({
        name: 'country_allowed',
        points: 10,
        explanation: `Country ${country} is in allow-list (+10)`,
      });
    }
  }
  // Unknown country (not in allow-list, not in block-list): +0 (no factor added)
  
  return factors;
}
