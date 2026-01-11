/**
 * Contactability scoring rules
 * 
 * Scores based on available contact methods:
 * - Email present
 * - Phone present
 * - Contact form signal (from enrichment data)
 */

import { ScoreFactor, ScoreInput } from '../types';

/**
 * Score for contactability factors
 */
export function scoreContactability(input: ScoreInput): ScoreFactor[] {
  const factors: ScoreFactor[] = [];
  
  // Email present: check lead.email (required) and contact.email (optional)
  const hasEmail = !!input.lead.email || !!input.contact?.email;
  if (hasEmail) {
    factors.push({
      name: 'email_present',
      points: 15,
      explanation: 'Email address available (+15)',
    });
  }
  
  // Phone present: check lead.phone and contact.phone
  const hasPhone = !!input.lead.phone || !!input.contact?.phone;
  if (hasPhone) {
    factors.push({
      name: 'phone_present',
      points: 10,
      explanation: 'Phone number available (+10)',
    });
  }
  
  // Contact form signal: check enrichment data for contact form indicators
  const hasContactForm = checkContactFormSignal(input);
  if (hasContactForm) {
    factors.push({
      name: 'contact_form_signal',
      points: 5,
      explanation: 'Contact form detected on website (+5)',
    });
  }
  
  return factors;
}

/**
 * Check if enrichment data indicates contact form presence
 * Looks for contactChannels.contactForms in enrichment data
 */
function checkContactFormSignal(input: ScoreInput): boolean {
  if (!input.company?.enrichmentData) {
    return false;
  }
  
  try {
    const enrichmentData = input.company.enrichmentData as {
      sources?: {
        website?: {
          data?: {
            contactChannels?: {
              contactForms?: Array<{ url?: string; presence?: boolean }>;
            };
          };
        };
      };
    };
    
    const contactForms = enrichmentData.sources?.website?.data?.contactChannels?.contactForms;
    if (contactForms && contactForms.length > 0) {
      // Check if any contact form has presence indicator or URL
      return contactForms.some(form => form.presence === true || !!form.url);
    }
  } catch {
    // If enrichment data structure is unexpected, return false
    return false;
  }
  
  return false;
}
