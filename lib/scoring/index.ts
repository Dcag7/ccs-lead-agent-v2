/**
 * Phase 3A/3B: Deterministic Scoring Engine - Main Export
 * 
 * Exports all scoring functions and types for use in the application.
 */

export { scoreLead } from './scoreLead';
export { buildScoreInput } from './buildScoreInput';
export { persistLeadScore } from './persistLeadScore';
export { normalizeLeadSource } from './normalizeLeadSource';
export type {
  ScoreInput,
  ScoreResult,
  ScoreFactor,
  ScoreFactorBreakdown,
  LeadClassification,
} from './types';
export { classifyScore, SCORE_BANDS } from './types';

// Export rules for testing/debugging if needed
export * from './rules';
