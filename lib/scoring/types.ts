/**
 * Phase 3A: Deterministic Scoring Engine - Types
 * 
 * Type definitions for the scoring system.
 * All scoring is rule-based, deterministic, and explainable.
 */

/**
 * Input data for scoring a lead
 */
export interface ScoreInput {
  /** Company data */
  company?: {
    name: string;
    website?: string | null;
    country?: string | null;
    size?: string | null; // e.g., "1-10", "11-50", "51-200", etc.
    enrichmentData?: unknown | null; // EnrichmentData JSON from Company.enrichmentData
    discoveryMetadata?: unknown | null;
  } | null;
  
  /** Contact data */
  contact?: {
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    linkedInUrl?: string | null;
    discoveryMetadata?: unknown | null;
  } | null;
  
  /** Lead data */
  lead: {
    email: string;
    phone?: string | null;
    source?: string | null; // Technical channel source (google, keyword, linkedin, etc.)
    businessSource?: string | null; // Business/acquisition source (referral, existing_customer, partner, etc.)
    status?: string | null;
    country?: string | null;
    discoveryMetadata?: unknown | null;
  };
}

/**
 * Individual score factor breakdown
 */
export interface ScoreFactor {
  /** Factor name/identifier */
  name: string;
  /** Points contributed by this factor */
  points: number;
  /** Human-readable explanation */
  explanation: string;
}

/**
 * Complete score result
 */
export interface ScoreResult {
  /** Total score (0-100) */
  totalScore: number;
  /** Breakdown of all scoring factors */
  scoreFactors: ScoreFactorBreakdown;
  /** Lead classification based on score bands */
  leadClassification: LeadClassification;
}

/**
 * Score factor breakdown
 */
export interface ScoreFactorBreakdown {
  /** Contactability factors (email, phone, contact form) */
  contactability: ScoreFactor[];
  /** Website quality signals */
  websiteQuality: ScoreFactor[];
  /** Geographic fit factors */
  geoFit: ScoreFactor[];
  /** Company size factors */
  companySize: ScoreFactor[];
  /** Lead source factors */
  leadSource: ScoreFactor[];
  /** All factors combined (for convenience) */
  all: ScoreFactor[];
}

/**
 * Lead classification based on score bands
 */
export type LeadClassification = 'hot' | 'warm' | 'cold';

/**
 * Score classification bands
 */
export const SCORE_BANDS = {
  HOT: { min: 70, max: 100, label: 'hot' as const },
  WARM: { min: 40, max: 69, label: 'warm' as const },
  COLD: { min: 0, max: 39, label: 'cold' as const },
} as const;

/**
 * Classify a score into hot/warm/cold
 */
export function classifyScore(score: number): LeadClassification {
  if (score >= SCORE_BANDS.HOT.min) {
    return 'hot';
  } else if (score >= SCORE_BANDS.WARM.min) {
    return 'warm';
  } else {
    return 'cold';
  }
}
