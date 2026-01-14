/**
 * Google Custom Search Engine (CSE) Configuration Validation
 * 
 * Centralized utility for validating Google CSE configuration.
 * Used by both discovery and enrichment features.
 */

export interface GoogleCseConfig {
  apiKey: string;
  cseId: string;
}

/**
 * Check if Google CSE is configured
 * 
 * @returns true if both GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID are set
 */
export function isConfigured(): boolean {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  return !!(apiKey && cseId);
}

/**
 * Get Google CSE configuration or throw error
 * 
 * @returns Google CSE configuration with API key and CSE ID
 * @throws Error if configuration is missing
 */
export function getConfigOrThrow(): GoogleCseConfig {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    throw new Error(
      'Google Custom Search is not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID environment variables.'
    );
  }

  return {
    apiKey,
    cseId,
  };
}

/**
 * Get Google CSE configuration (safe, returns undefined if not configured)
 * 
 * @returns Google CSE configuration or undefined if not configured
 */
export function getConfig(): GoogleCseConfig | undefined {
  if (!isConfigured()) {
    return undefined;
  }

  return {
    apiKey: process.env.GOOGLE_CSE_API_KEY!,
    cseId: process.env.GOOGLE_CSE_ID!,
  };
}

/**
 * Get configuration status for health checks
 * 
 * @returns Status object with configuration details (safe, never returns secrets)
 */
export function getConfigStatus(): {
  configured: boolean;
  apiKeyPresent: boolean;
  cseIdPresent: boolean;
} {
  return {
    configured: isConfigured(),
    apiKeyPresent: !!process.env.GOOGLE_CSE_API_KEY,
    cseIdPresent: !!process.env.GOOGLE_CSE_ID,
  };
}
