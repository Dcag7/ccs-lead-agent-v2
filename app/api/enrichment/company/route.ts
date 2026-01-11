/**
 * Company Enrichment API Endpoint
 * Phase 2: Enrichment MVP
 * 
 * POST /api/enrichment/company
 * 
 * On-demand enrichment of company data using multiple sources:
 * - Website enricher (extracts metadata from Company.website)
 * - Google CSE enricher (searches for company information)
 * 
 * Protected by NextAuth - requires authenticated user.
 * 
 * FUTURE EXTENSION POINTS:
 * - Scheduled/automated enrichment jobs (nightly batch processing)
 * - Enrichment scoring that influences lead/company scores
 * - Additional enrichment sources (LinkedIn, Crunchbase, etc.)
 * - Webhook notifications on enrichment completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CompanyEnrichmentRunner } from '@/lib/enrichment/CompanyEnrichmentRunner';

/**
 * POST /api/enrichment/company
 * 
 * Enrich a company with external data from multiple sources
 * 
 * Request body:
 * {
 *   "companyId": "string",
 *   "forceRefresh": boolean (optional, default: false)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "company": { ... updated company data ... },
 *   "enrichmentSummary": {
 *     "status": "success" | "failed",
 *     "sourcesRun": string[],
 *     "sourcesSucceeded": string[],
 *     "sourcesFailed": string[],
 *     "timestamp": string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { companyId, forceRefresh } = body;

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. companyId is required.' },
        { status: 400 }
      );
    }

    // Validate forceRefresh if provided
    if (forceRefresh !== undefined && typeof forceRefresh !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. forceRefresh must be a boolean.' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found.' },
        { status: 404 }
      );
    }

    // Run enrichment using CompanyEnrichmentRunner
    const runner = new CompanyEnrichmentRunner();
    const enrichmentSummary = await runner.enrichCompany(companyId);

    // Fetch updated company from database
    const updatedCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!updatedCompany) {
      // This should never happen, but handle it gracefully
      return NextResponse.json(
        { error: 'Company not found after enrichment.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      enrichmentSummary,
    });
  } catch (error: unknown) {
    console.error('Enrichment API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal server error during enrichment.',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
