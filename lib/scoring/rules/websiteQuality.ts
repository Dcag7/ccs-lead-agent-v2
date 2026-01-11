/**
 * Website quality scoring rules
 * 
 * Scores based on website signals:
 * - Website exists
 * - Enrichment succeeded
 * - Has services data
 * - Has locations data
 */

import { ScoreFactor, ScoreInput } from '../types';

/**
 * Score for website quality factors
 */
export function scoreWebsiteQuality(input: ScoreInput): ScoreFactor[] {
  const factors: ScoreFactor[] = [];
  
  // Website exists
  const hasWebsite = !!input.company?.website;
  if (hasWebsite) {
    factors.push({
      name: 'website_exists',
      points: 10,
      explanation: 'Company website available (+10)',
    });
  }
  
  // Enrichment succeeded: check enrichmentStatus or enrichmentData
  const enrichmentSucceeded = checkEnrichmentSuccess(input);
  if (enrichmentSucceeded) {
    factors.push({
      name: 'enrichment_succeeded',
      points: 10,
      explanation: 'Website enrichment completed successfully (+10)',
    });
  }
  
  // Has services data: check enrichment data for services
  const hasServices = checkHasServices(input);
  if (hasServices) {
    factors.push({
      name: 'has_services',
      points: 8,
      explanation: 'Services information found (+8)',
    });
  }
  
  // Has locations data: check enrichment data for locations
  const hasLocations = checkHasLocations(input);
  if (hasLocations) {
    factors.push({
      name: 'has_locations',
      points: 7,
      explanation: 'Location information found (+7)',
    });
  }
  
  return factors;
}

/**
 * Check if enrichment succeeded
 * Looks for successful enrichment data structure
 */
function checkEnrichmentSuccess(input: ScoreInput): boolean {
  if (!input.company?.enrichmentData) {
    return false;
  }
  
  try {
    const enrichmentData = input.company.enrichmentData as {
      sources?: {
        website?: { success?: boolean };
        googleCse?: { success?: boolean };
      };
    };
    
    const websiteSuccess = enrichmentData.sources?.website?.success === true;
    const googleCseSuccess = enrichmentData.sources?.googleCse?.success === true;
    
    return websiteSuccess || googleCseSuccess;
  } catch {
    return false;
  }
}

/**
 * Check if services data exists in enrichment data
 */
function checkHasServices(input: ScoreInput): boolean {
  if (!input.company?.enrichmentData) {
    return false;
  }
  
  try {
    const enrichmentData = input.company.enrichmentData as {
      sources?: {
        website?: {
          data?: {
            services?: {
              services?: string[];
            };
          };
        };
      };
    };
    
    const services = enrichmentData.sources?.website?.data?.services?.services;
    return !!(services && services.length > 0);
  } catch {
    return false;
  }
}

/**
 * Check if locations data exists in enrichment data
 */
function checkHasLocations(input: ScoreInput): boolean {
  if (!input.company?.enrichmentData) {
    return false;
  }
  
  try {
    const enrichmentData = input.company.enrichmentData as {
      sources?: {
        website?: {
          data?: {
            locations?: {
              locations?: string[];
            };
          };
        };
      };
    };
    
    const locations = enrichmentData.sources?.website?.data?.locations?.locations;
    return !!(locations && locations.length > 0);
  } catch {
    return false;
  }
}
