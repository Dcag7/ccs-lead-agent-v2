/**
 * POST /api/scoring/lead
 * 
 * Manual trigger for lead scoring.
 * Optionally updates businessSource before scoring.
 * 
 * Body:
 * {
 *   "leadId": "string",
 *   "businessSource": "string (optional)"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { persistLeadScore } from '@/lib/scoring/persistLeadScore';
import { buildScoreInput } from '@/lib/scoring/buildScoreInput';
import { normalizeLeadSource } from '@/lib/scoring/normalizeLeadSource';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { leadId, businessSource } = body;

    if (!leadId || typeof leadId !== 'string') {
      return NextResponse.json(
        { error: 'leadId is required and must be a string' },
        { status: 400 }
      );
    }

    // Update businessSource if provided (trim + lowercase)
    if (businessSource !== undefined && businessSource !== null) {
      const normalizedBusinessSource = String(businessSource).trim().toLowerCase();
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          businessSource: normalizedBusinessSource || null,
        },
      });
    }

    // Verify lead exists
    const leadExists = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    });

    if (!leadExists) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Build input to get normalized source used for scoring
    const scoreInput = await buildScoreInput(leadId);
    const normalizedSourceLabel = normalizeLeadSource(scoreInput);

    // Persist score
    const scoreResult = await persistLeadScore(leadId);

    // Return response
    return NextResponse.json(
      {
        success: true,
        leadId,
        score: scoreResult.totalScore,
        classification: scoreResult.leadClassification,
        scoreFactors: scoreResult.scoreFactors,
        businessSourceUsedForScoring: normalizedSourceLabel,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error scoring lead:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle known errors
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to score lead', details: errorMessage },
      { status: 500 }
    );
  }
}
