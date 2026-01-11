/**
 * Lead source scoring rules
 * 
 * Scores based on normalized lead source (business source prioritized over technical source):
 * - Business sources (referral, existing_customer, partner, etc.) get highest scores
 * - Technical sources (google, linkedin, keyword, etc.) get medium scores
 * - Must be explainable and deterministic
 */

import { ScoreFactor, ScoreInput } from '../types';
import { normalizeLeadSource } from '../normalizeLeadSource';

/**
 * Score for lead source factors
 */
export function scoreLeadSource(input: ScoreInput): ScoreFactor[] {
  const factors: ScoreFactor[] = [];
  
  const normalizedSource = normalizeLeadSource(input);
  
  if (normalizedSource === 'unknown') {
    // Unknown source: no points
    return factors;
  }
  
  let points = 0;
  let explanation = '';
  
  // Business source scoring (prioritized - highest scores)
  if (normalizedSource === 'referral') {
    points = 15;
    explanation = 'Business source is referral (+15)';
  } else if (normalizedSource === 'existing_customer') {
    points = 14;
    explanation = 'Business source is existing customer (+14)';
  } else if (normalizedSource === 'partner' || normalizedSource === 'partnership') {
    points = 12;
    explanation = 'Business source is partner (+12)';
  } else if (normalizedSource === 'inbound') {
    points = 10;
    explanation = 'Business source is inbound (+10)';
  } else if (normalizedSource === 'organic_social') {
    points = 7;
    explanation = 'Business source is organic social (+7)';
  } else if (normalizedSource === 'paid_social') {
    points = 7;
    explanation = 'Business source is paid social (+7)';
  } else if (normalizedSource === 'event') {
    points = 7;
    explanation = 'Business source is event (+7)';
  } else if (normalizedSource === 'email_campaign') {
    points = 6;
    explanation = 'Business source is email campaign (+6)';
  } else if (normalizedSource === 'outbound') {
    points = 4;
    explanation = 'Business source is outbound (+4)';
  } 
  // Technical source scoring (fallback - medium scores)
  else if (normalizedSource === 'google' || normalizedSource.includes('google')) {
    points = 6;
    explanation = 'Technical source is Google discovery (+6)';
  } else if (normalizedSource === 'linkedin' || normalizedSource.includes('linkedin')) {
    points = 6;
    explanation = 'Technical source is LinkedIn discovery (+6)';
  } else if (normalizedSource === 'keyword' || normalizedSource.includes('keyword')) {
    points = 5;
    explanation = 'Technical source is keyword discovery (+5)';
  } else if (normalizedSource === 'social' || normalizedSource.includes('social')) {
    points = 5;
    explanation = 'Technical source is social discovery (+5)';
  } else if (normalizedSource === 'import' || normalizedSource.includes('import')) {
    points = 3;
    explanation = 'Technical source is import (+3)';
  } else if (normalizedSource === 'enrichment' || normalizedSource.includes('enrichment')) {
    points = 3;
    explanation = 'Technical source is enrichment (+3)';
  } else if (normalizedSource.includes('cold') || normalizedSource.includes('outbound')) {
    points = 3;
    explanation = 'Technical source is cold/outbound (+3)';
  } else {
    // Unknown/other source: minimal points
    points = 2;
    explanation = `Source is ${normalizedSource} (+2)`;
  }
  
  if (points > 0) {
    factors.push({
      name: 'lead_source',
      points,
      explanation,
    });
  }
  
  return factors;
}
