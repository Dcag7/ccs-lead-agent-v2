/**
 * Normalize lead source for scoring
 * 
 * Returns a normalized label used for scoring priority:
 * 1. If businessSource exists -> use businessSource
 * 2. Else if lead.source exists -> use lead.source
 * 3. Else if lead.discoveryMetadata?.source exists -> use that
 * 4. Else -> "unknown"
 * 
 * IMPORTANT: No inference from snippets or other data.
 */

import type { ScoreInput } from './types';

/**
 * Normalize lead source for scoring
 * 
 * @param input - ScoreInput with lead data
 * @returns Normalized source label (lowercase, trimmed)
 */
export function normalizeLeadSource(input: ScoreInput): string {
  // Priority 1: businessSource (business/acquisition source)
  if (input.lead.businessSource) {
    return input.lead.businessSource.toLowerCase().trim();
  }
  
  // Priority 2: source (technical channel)
  if (input.lead.source) {
    return input.lead.source.toLowerCase().trim();
  }
  
  // Priority 3: discoveryMetadata.source
  if (input.lead.discoveryMetadata) {
    try {
      const metadata = input.lead.discoveryMetadata as {
        discoverySource?: string;
        source?: string;
      };
      const source = metadata.discoverySource || metadata.source;
      if (source) {
        return String(source).toLowerCase().trim();
      }
    } catch {
      // If metadata structure is unexpected, continue to fallback
    }
  }
  
  // Priority 4: unknown
  return 'unknown';
}
