/**
 * Phase 3A: Deterministic Scoring Engine - Main Scoring Function
 * 
 * Pure function that computes a lead score (0-100) based on input data.
 * Uses rule-based scoring factors that are deterministic and explainable.
 */

import {
  ScoreInput,
  ScoreResult,
  ScoreFactorBreakdown,
  classifyScore,
} from './types';
import {
  scoreContactability,
  scoreWebsiteQuality,
  scoreGeoFit,
  scoreCompanySize,
  scoreLeadSource,
} from './rules';

/**
 * Calculate score for a lead
 * 
 * This is a pure function that takes input data and returns a score result.
 * No side effects, no database access, fully deterministic.
 * 
 * @param input - Lead, Company, and Contact data
 * @returns ScoreResult with totalScore, scoreFactors, and leadClassification
 */
export function scoreLead(input: ScoreInput): ScoreResult {
  // Validate required input
  if (!input.lead?.email) {
    throw new Error('Lead email is required');
  }
  
  // Score each category
  const contactabilityFactors = scoreContactability(input);
  const websiteQualityFactors = scoreWebsiteQuality(input);
  const geoFitFactors = scoreGeoFit(input);
  const companySizeFactors = scoreCompanySize(input);
  const leadSourceFactors = scoreLeadSource(input);
  
  // Combine all factors
  const allFactors = [
    ...contactabilityFactors,
    ...websiteQualityFactors,
    ...geoFitFactors,
    ...companySizeFactors,
    ...leadSourceFactors,
  ];
  
  // Calculate total score
  const totalScore = Math.min(100, Math.max(0, allFactors.reduce((sum, factor) => sum + factor.points, 0)));
  
  // Build score factor breakdown
  const scoreFactors: ScoreFactorBreakdown = {
    contactability: contactabilityFactors,
    websiteQuality: websiteQualityFactors,
    geoFit: geoFitFactors,
    companySize: companySizeFactors,
    leadSource: leadSourceFactors,
    all: allFactors,
  };
  
  // Classify lead
  const leadClassification = classifyScore(totalScore);
  
  return {
    totalScore,
    scoreFactors,
    leadClassification,
  };
}
