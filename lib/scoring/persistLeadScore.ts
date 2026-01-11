/**
 * Persist lead score to database
 * 
 * Calculates score using scoreLead() and persists:
 * - Lead.score
 * - Lead.scoreFactors (Json)
 * - Lead.classification
 * - Lead.scoredAt
 * 
 * Idempotent: safe to re-run.
 */

import { prisma } from '@/lib/prisma';
import { scoreLead } from './scoreLead';
import { buildScoreInput } from './buildScoreInput';
import type { ScoreResult } from './types';

/**
 * Persist score for a lead
 * 
 * @param leadId - Lead ID to score and persist
 * @returns ScoreResult with score, classification, and factors
 * @throws Error if lead not found or scoring fails
 */
export async function persistLeadScore(leadId: string): Promise<ScoreResult> {
  // Build input from database
  const scoreInput = await buildScoreInput(leadId);

  // Calculate score
  const scoreResult = scoreLead(scoreInput);

  // Persist to database
  // Serialize scoreFactors as JSON (Prisma Json type)
  const scoreFactorsJson = JSON.parse(JSON.stringify(scoreResult.scoreFactors));
  
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score: scoreResult.totalScore,
      scoreFactors: scoreFactorsJson,
      classification: scoreResult.leadClassification,
      scoredAt: new Date(),
    },
  });

  return scoreResult;
}
