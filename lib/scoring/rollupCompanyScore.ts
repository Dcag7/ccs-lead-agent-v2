/**
 * Company Rollup Score
 * 
 * Computes aggregated scoring metrics for all leads belonging to a company.
 * This is computed on-read (not persisted) for flexibility.
 */

import { prisma } from '@/lib/prisma';

export interface CompanyRollupScore {
  /** Average score across all leads */
  avgScore: number;
  /** Maximum score across all leads */
  maxScore: number;
  /** Count of hot leads (score >= 70) */
  countHot: number;
  /** Count of warm leads (score 40-69) */
  countWarm: number;
  /** Count of cold leads (score < 40) */
  countCold: number;
  /** Total number of leads */
  totalLeads: number;
  /** Number of leads that have been scored (scoredAt is not null) */
  scoredLeads: number;
  /** Most recent scoredAt timestamp across all leads */
  lastScoredAt: Date | null;
}

/**
 * Compute rollup score for a company
 * 
 * @param companyId - Company ID to compute rollup for
 * @returns CompanyRollupScore with aggregated metrics
 */
export async function rollupCompanyScore(companyId: string): Promise<CompanyRollupScore> {
  // Fetch all leads for this company
  const leads = await prisma.lead.findMany({
    where: {
      companyId,
      status: { not: 'archived' }, // Exclude archived leads
    },
    select: {
      score: true,
      scoredAt: true,
      classification: true,
    },
  });

  if (leads.length === 0) {
    return {
      avgScore: 0,
      maxScore: 0,
      countHot: 0,
      countWarm: 0,
      countCold: 0,
      totalLeads: 0,
      scoredLeads: 0,
      lastScoredAt: null,
    };
  }

  // Compute metrics
  const scores = leads.map((lead) => lead.score);
  const scoredLeads = leads.filter((lead) => lead.scoredAt !== null);
  const scoredAtTimestamps = scoredLeads
    .map((lead) => lead.scoredAt)
    .filter((date): date is Date => date !== null);

  const avgScore =
    scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

  // Count by classification
  let countHot = 0;
  let countWarm = 0;
  let countCold = 0;

  for (const lead of leads) {
    if (lead.classification === 'hot') {
      countHot++;
    } else if (lead.classification === 'warm') {
      countWarm++;
    } else if (lead.classification === 'cold') {
      countCold++;
    } else {
      // If classification is missing, infer from score
      if (lead.score >= 70) {
        countHot++;
      } else if (lead.score >= 40) {
        countWarm++;
      } else {
        countCold++;
      }
    }
  }

  // Find most recent scoredAt
  const lastScoredAt =
    scoredAtTimestamps.length > 0
      ? new Date(Math.max(...scoredAtTimestamps.map((d) => d.getTime())))
      : null;

  return {
    avgScore: Math.round(avgScore * 10) / 10, // Round to 1 decimal
    maxScore,
    countHot,
    countWarm,
    countCold,
    totalLeads: leads.length,
    scoredLeads: scoredLeads.length,
    lastScoredAt,
  };
}
