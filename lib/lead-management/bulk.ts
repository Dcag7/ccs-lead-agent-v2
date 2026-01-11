/**
 * Phase 4B: Lead Management - Bulk Operations
 * 
 * Utilities for bulk lead operations validation and processing.
 */

import { z } from 'zod';
import { validateStatus } from './status';

/**
 * Maximum number of leads that can be updated in a single bulk operation
 */
export const MAX_BULK_LEAD_COUNT = 100;

/**
 * Schema for bulk update request
 */
export const bulkUpdateSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1).max(MAX_BULK_LEAD_COUNT),
  updates: z.object({
    status: z.string().optional(),
    assignedToId: z.string().nullable().optional(),
  }).refine(
    (data) => data.status !== undefined || data.assignedToId !== undefined,
    { message: 'At least one update field (status or assignedToId) must be provided' }
  ),
});

export type BulkUpdateRequest = z.infer<typeof bulkUpdateSchema>;

/**
 * Validate bulk update request
 * @throws Error if validation fails
 */
export function validateBulkUpdateRequest(data: unknown): BulkUpdateRequest {
  const result = bulkUpdateSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid bulk update request: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Validate status if provided
 * @throws Error if status is invalid
 */
export function validateBulkStatus(status?: string): void {
  if (status !== undefined) {
    validateStatus(status);
  }
}

/**
 * Build Prisma update data from bulk update request
 */
export function buildBulkUpdateData(
  updates: BulkUpdateRequest['updates']
): { status?: string; assignedToId?: string | null } {
  const data: { status?: string; assignedToId?: string | null } = {};

  if (updates.status !== undefined) {
    data.status = updates.status;
  }

  if (updates.assignedToId !== undefined) {
    data.assignedToId = updates.assignedToId;
  }

  return data;
}
