/**
 * Phase 2B: Contacts + Leads Extraction
 * 
 * Pure extraction utility - extracts contact candidates from Company.enrichmentData.
 * No database writes - returns candidates array.
 */

import type { EnrichmentData } from '../types';

/**
 * Contact candidate extracted from enrichment data
 */
export interface ContactCandidate {
  email: string;
  phone?: string;
  source: 'website' | 'googleCse';
  rawEvidence?: string; // Text snippet where email/phone was found
}

/**
 * Extract contact candidates from Company.enrichmentData
 * 
 * Sources:
 * - Website enrichment: description field
 * - Google CSE: snippet and rawResults[].snippet
 * 
 * @param enrichmentData - Company.enrichmentData JSON
 * @returns Array of contact candidates (deduplicated by email)
 */
export function extractContactCandidates(
  enrichmentData: EnrichmentData | null
): ContactCandidate[] {
  if (!enrichmentData) {
    return [];
  }

  const candidates: ContactCandidate[] = [];
  const seenEmails = new Set<string>();

  // Extract from website enrichment
  if (enrichmentData.sources?.website?.success && enrichmentData.sources.website.data?.description) {
    const description = enrichmentData.sources.website.data.description;
    const extracted = extractFromText(description, 'website');
    for (const candidate of extracted) {
      const normalizedEmail = normalizeEmail(candidate.email);
      if (!seenEmails.has(normalizedEmail) && !isPlaceholderEmail(candidate.email)) {
        seenEmails.add(normalizedEmail);
        candidates.push(candidate);
      }
    }
  }

  // Extract from Google CSE snippet
  if (
    enrichmentData.sources?.googleCse?.success &&
    enrichmentData.sources.googleCse.data?.snippet
  ) {
    const snippet = enrichmentData.sources.googleCse.data.snippet;
    const extracted = extractFromText(snippet, 'googleCse');
    for (const candidate of extracted) {
      const normalizedEmail = normalizeEmail(candidate.email);
      if (!seenEmails.has(normalizedEmail) && !isPlaceholderEmail(candidate.email)) {
        seenEmails.add(normalizedEmail);
        candidates.push(candidate);
      }
    }
  }

  // Extract from Google CSE raw results (limit to first 3)
  if (
    enrichmentData.sources?.googleCse?.success &&
    enrichmentData.sources.googleCse.data?.rawResults
  ) {
    const rawResults = enrichmentData.sources.googleCse.data.rawResults.slice(0, 3);
    for (const result of rawResults) {
      if (result.snippet) {
        const extracted = extractFromText(result.snippet, 'googleCse');
        for (const candidate of extracted) {
          const normalizedEmail = normalizeEmail(candidate.email);
          if (!seenEmails.has(normalizedEmail) && !isPlaceholderEmail(candidate.email)) {
            seenEmails.add(normalizedEmail);
            candidates.push(candidate);
          }
        }
      }
    }
  }

  return candidates;
}

/**
 * Extract emails and phones from text
 */
function extractFromText(
  text: string,
  source: 'website' | 'googleCse'
): ContactCandidate[] {
  const candidates: ContactCandidate[] = [];

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = text.match(emailRegex) || [];

  // Extract phones
  const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g;
  const phoneMatches = text.match(phoneRegex) || [];

  // Normalize and deduplicate emails
  const normalizedEmails = new Set<string>();
  for (const email of emailMatches) {
    const normalized = normalizeEmail(email);
    if (!normalizedEmails.has(normalized)) {
      normalizedEmails.add(normalized);
    }
  }

  // Normalize and deduplicate phones
  const normalizedPhones = Array.from(
    new Set(phoneMatches.map((phone) => normalizePhone(phone)))
  );

  // Create candidates (one per email, try to match with phone if nearby)
  for (const email of normalizedEmails) {
    const candidate: ContactCandidate = {
      email,
      source,
      rawEvidence: text.substring(0, 200), // Store first 200 chars as evidence
    };

    // Try to match phone with email (if only one phone, use it)
    if (normalizedPhones.length === 1) {
      candidate.phone = normalizedPhones[0];
    }

    candidates.push(candidate);
  }

  // If we have phones but no emails, skip (phones alone are not enough)
  // In MVP, we require email to create a Contact

  return candidates;
}

/**
 * Normalize email address (lowercase, trim)
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalize phone number (trim, remove extra spaces)
 */
function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, ' ');
}

/**
 * Check if email is a placeholder/test email
 */
function isPlaceholderEmail(email: string): boolean {
  const lower = email.toLowerCase();
  const placeholderPatterns = [
    'example@',
    'noreply@',
    'no-reply@',
    'test@',
    'placeholder@',
    '@example.com',
    '@test.com',
  ];

  return placeholderPatterns.some((pattern) => lower.includes(pattern));
}
