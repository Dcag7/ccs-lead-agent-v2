/**
 * Company size scoring rules
 * 
 * Scores based on company size buckets:
 * - Maps size strings to points
 * - Simple deterministic mapping
 */

import { ScoreFactor, ScoreInput } from '../types';

/**
 * Score for company size factors
 */
export function scoreCompanySize(input: ScoreInput): ScoreFactor[] {
  const factors: ScoreFactor[] = [];
  
  const size = input.company?.size;
  
  if (!size) {
    // No size data: no points
    return factors;
  }
  
  const sizeLower = size.toLowerCase().trim();
  let points = 0;
  let explanation = '';
  
  // Parse size ranges and assign points
  // Formats: "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
  
  if (sizeLower.includes('1000') || sizeLower.includes('500') && sizeLower.includes('1000')) {
    points = 20;
    explanation = 'Company size is large (500-1000+) (+20)';
  } else if (sizeLower.includes('500') || sizeLower.includes('200') && sizeLower.includes('500')) {
    points = 18;
    explanation = 'Company size is medium-large (200-500) (+18)';
  } else if (sizeLower.includes('200') || sizeLower.includes('100') && sizeLower.includes('200')) {
    points = 15;
    explanation = 'Company size is medium (100-200) (+15)';
  } else if (sizeLower.includes('100') || sizeLower.includes('50') && sizeLower.includes('100')) {
    points = 12;
    explanation = 'Company size is medium-small (50-100) (+12)';
  } else if (sizeLower.includes('50') || sizeLower.includes('10') && sizeLower.includes('50')) {
    points = 10;
    explanation = 'Company size is small-medium (10-50) (+10)';
  } else if (sizeLower.includes('10') || sizeLower.includes('1') && sizeLower.includes('10')) {
    points = 5;
    explanation = 'Company size is small (1-10) (+5)';
  } else {
    // Unknown format: give minimal points
    points = 3;
    explanation = `Company size provided but format unknown: ${size} (+3)`;
  }
  
  if (points > 0) {
    factors.push({
      name: 'company_size',
      points,
      explanation,
    });
  }
  
  return factors;
}
