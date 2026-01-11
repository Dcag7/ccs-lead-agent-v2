/**
 * Phase 4A: Lead Management - Status Validation
 */

import { ALLOWED_STATUSES, type LeadStatus } from './types';

/**
 * Check if a status value is valid
 */
export function isValidStatus(status: string): status is LeadStatus {
  return ALLOWED_STATUSES.includes(status as LeadStatus);
}

/**
 * Validate status value
 * @throws Error if status is invalid
 */
export function validateStatus(status: string): LeadStatus {
  if (!isValidStatus(status)) {
    throw new Error(
      `Invalid status: ${status}. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
    );
  }
  return status;
}
