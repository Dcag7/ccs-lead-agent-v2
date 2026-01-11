/**
 * Phase 4A: Lead Management - Type Definitions
 */

/**
 * Allowed lead status values
 */
export const ALLOWED_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'archived'
] as const;

export type LeadStatus = typeof ALLOWED_STATUSES[number];

/**
 * Maximum note content length
 */
export const MAX_NOTE_LENGTH = 5000;

/**
 * Minimum note content length (after trimming)
 */
export const MIN_NOTE_LENGTH = 1;
