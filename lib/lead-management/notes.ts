/**
 * Phase 4A: Lead Management - Note Validation
 */

import { MAX_NOTE_LENGTH, MIN_NOTE_LENGTH } from './types';

/**
 * Validate note content
 * @throws Error if content is invalid
 */
export function validateNoteContent(content: string): string {
  const trimmed = content.trim();
  
  if (trimmed.length < MIN_NOTE_LENGTH) {
    throw new Error('Note content cannot be empty');
  }
  
  if (trimmed.length > MAX_NOTE_LENGTH) {
    throw new Error(`Note content exceeds ${MAX_NOTE_LENGTH} characters`);
  }
  
  return trimmed;
}
