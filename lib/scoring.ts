/**
 * CCS Lead Agent v2 - Scoring Engine (Rules-Based v1)
 * 
 * Pure functions for calculating scores (0-100) for leads and companies.
 * Future enhancements will integrate external data sources and AI-based scoring.
 */

export interface ScoringResult {
  score: number;        // 0-100
  reasons: string[];    // Human-readable explanations
}

/**
 * Calculate score for a Lead
 * 
 * Scoring factors:
 * - Status: qualified leads score higher
 * - Source: referrals and partnerships score higher
 * - Company size: larger companies score higher
 * - Country: South Africa and Botswana preferred
 * 
 * @param lead - Lead data from database
 * @returns ScoringResult with score and reasons
 */
export function scoreLead(lead: {
  status?: string | null;
  source?: string | null;
  country?: string | null;
  companyRel?: {
    size?: string | null;
  } | null;
}): ScoringResult {
  let score = 0;
  const reasons: string[] = [];

  // Status scoring (0-30 points)
  const status = lead.status?.toLowerCase() || 'new';
  if (status === 'qualified') {
    score += 30;
    reasons.push('Status is qualified (+30)');
  } else if (status === 'contacted') {
    score += 20;
    reasons.push('Status is contacted (+20)');
  } else if (status === 'new') {
    score += 10;
    reasons.push('Status is new (+10)');
  } else {
    score += 5;
    reasons.push(`Status is ${status} (+5)`);
  }

  // Source scoring (0-25 points)
  const source = lead.source?.toLowerCase() || '';
  if (source.includes('referral')) {
    score += 25;
    reasons.push('Source is referral (+25)');
  } else if (source.includes('partnership') || source.includes('partner')) {
    score += 20;
    reasons.push('Source is partnership (+20)');
  } else if (source.includes('website') || source.includes('inbound')) {
    score += 15;
    reasons.push('Source is inbound/website (+15)');
  } else if (source.includes('cold') || source.includes('outbound')) {
    score += 5;
    reasons.push('Source is cold/outbound (+5)');
  } else if (source) {
    score += 10;
    reasons.push(`Source is ${source} (+10)`);
  }

  // Country scoring (0-15 points)
  const country = lead.country?.toLowerCase() || '';
  if (country.includes('south africa') || country === 'za') {
    score += 15;
    reasons.push('Country is South Africa (+15)');
  } else if (country.includes('botswana') || country === 'bw') {
    score += 10;
    reasons.push('Country is Botswana (+10)');
  } else if (country) {
    score += 5;
    reasons.push(`Country is ${lead.country} (+5)`);
  }

  // Company size scoring (0-30 points)
  // Future: enrich with LinkedIn company data for more accurate sizing
  const companySize = lead.companyRel?.size?.toLowerCase() || '';
  if (companySize.includes('500') || companySize.includes('1000')) {
    score += 30;
    reasons.push('Company size is large (500+) (+30)');
  } else if (companySize.includes('200') || companySize.includes('250')) {
    score += 25;
    reasons.push('Company size is medium-large (200+) (+25)');
  } else if (companySize.includes('50') || companySize.includes('100')) {
    score += 20;
    reasons.push('Company size is medium (50+) (+20)');
  } else if (companySize.includes('10') || companySize.includes('20')) {
    score += 10;
    reasons.push('Company size is small (10+) (+10)');
  }

  // Future enrichment opportunities:
  // - Google search for company website and social presence
  // - LinkedIn profile enrichment for contact validation
  // - AI-based sentiment analysis of contact interactions
  // - Email engagement scoring (open rates, click rates)
  // - Industry-specific scoring adjustments

  // Ensure score is within 0-100 range
  score = Math.min(100, Math.max(0, score));

  return { score, reasons };
}

/**
 * Calculate score for a Company
 * 
 * Scoring factors:
 * - Number of leads: more leads indicate higher interest
 * - Number of contacts: more contacts indicate better coverage
 * - Country: South Africa and Botswana preferred
 * - Industry: certain industries score higher
 * 
 * @param company - Company data from database with related counts
 * @returns ScoringResult with score and reasons
 */
export function scoreCompany(company: {
  country?: string | null;
  industry?: string | null;
  _count?: {
    leads?: number;
    contacts?: number;
  };
  leads?: Array<{ status?: string | null; source?: string | null }>;
  contacts?: Array<{ email?: string | null; phone?: string | null }>;
}): ScoringResult {
  let score = 0;
  const reasons: string[] = [];

  // Lead count scoring (0-50 points)
  const leadCount = company._count?.leads || company.leads?.length || 0;
  if (leadCount >= 6) {
    score += 50;
    reasons.push(`Has ${leadCount} leads (+50)`);
  } else if (leadCount >= 3) {
    score += 35;
    reasons.push(`Has ${leadCount} leads (+35)`);
  } else if (leadCount >= 1) {
    score += 20;
    reasons.push(`Has ${leadCount} lead(s) (+20)`);
  }

  // Contact count scoring (0-35 points)
  const contactCount = company._count?.contacts || company.contacts?.length || 0;
  if (contactCount >= 6) {
    score += 35;
    reasons.push(`Has ${contactCount} contacts (+35)`);
  } else if (contactCount >= 3) {
    score += 25;
    reasons.push(`Has ${contactCount} contacts (+25)`);
  } else if (contactCount >= 1) {
    score += 15;
    reasons.push(`Has ${contactCount} contact(s) (+15)`);
  }

  // Country scoring (0-15 points)
  const country = company.country?.toLowerCase() || '';
  if (country.includes('south africa') || country === 'za') {
    score += 15;
    reasons.push('Country is South Africa (+15)');
  } else if (country.includes('botswana') || country === 'bw') {
    score += 10;
    reasons.push('Country is Botswana (+10)');
  } else if (country) {
    score += 5;
    reasons.push(`Country is ${company.country} (+5)`);
  }

  // Industry scoring (0-10 points)
  // Simple rules for now; can be expanded based on CCS's target industries
  // Future: enrich with external industry data and market analysis
  const industry = company.industry?.toLowerCase() || '';
  if (industry.includes('apparel') || industry.includes('textile') || industry.includes('fashion')) {
    score += 10;
    reasons.push('Industry is target sector (apparel/textile) (+10)');
  } else if (industry.includes('manufacturing') || industry.includes('retail')) {
    score += 8;
    reasons.push('Industry is related sector (+8)');
  } else if (industry) {
    score += 5;
    reasons.push(`Industry is ${company.industry} (+5)`);
  }

  // Future enrichment opportunities:
  // - Google search for company website and social media presence
  // - LinkedIn company page data (follower count, employee count)
  // - Financial data (revenue, funding, growth indicators)
  // - News and press mentions for brand visibility
  // - AI-based company health assessment

  // Ensure score is within 0-100 range
  score = Math.min(100, Math.max(0, score));

  return { score, reasons };
}
