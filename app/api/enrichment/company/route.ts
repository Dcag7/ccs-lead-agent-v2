/**
 * Company Enrichment API Endpoint
 * Phase 6: External Company Enrichment v1
 * 
 * POST /api/enrichment/company
 * 
 * On-demand enrichment of company data using Google Custom Search Engine.
 * Protected by NextAuth - requires authenticated user.
 * 
 * FUTURE EXTENSION POINTS:
 * - Scheduled/automated enrichment jobs (nightly batch processing)
 * - Enrichment scoring that influences lead/company scores
 * - Multiple enrichment sources (LinkedIn, Crunchbase, etc.)
 * - Webhook notifications on enrichment completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  searchCompany,
  isLikelyCompanyWebsite,
  inferIndustryFromSnippet,
} from '@/lib/googleSearch';

/**
 * POST /api/enrichment/company
 * 
 * Enrich a company with external data from Google CSE
 * 
 * Request body:
 * {
 *   "companyId": "string"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "company": { ... updated company data ... },
 *   "enrichmentSummary": {
 *     "status": "success" | "failed",
 *     "websiteFound": boolean,
 *     "industryInferred": boolean,
 *     "source": "google_cse"
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
    const { companyId } = body;

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. companyId is required.' },
        { status: 400 }
      );
    }

    // Fetch company from database
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found.' },
        { status: 404 }
      );
    }

    // Update status to pending
    await prisma.company.update({
      where: { id: companyId },
      data: {
        enrichmentStatus: 'pending',
      },
    });

    // Perform Google search enrichment
    const searchResult = await searchCompany(company.name, company.country || undefined);

    // Check if Google CSE is configured
    if (!searchResult.configured) {
      // Update status to failed with clear message
      const updatedCompany = await prisma.company.update({
        where: { id: companyId },
        data: {
          enrichmentStatus: 'failed',
          enrichmentLastRun: new Date(),
          enrichmentData: {
            error: searchResult.error,
            timestamp: new Date().toISOString(),
            configured: false,
          },
        },
      });

      return NextResponse.json({
        success: false,
        error: searchResult.error,
        company: updatedCompany,
      });
    }

    // Process search results
    let enrichmentStatus: 'success' | 'failed' = 'failed';
    let websiteFromGoogle: string | null = null;
    let inferredIndustry: string | null = null;

    if (searchResult.success && searchResult.primaryUrl) {
      enrichmentStatus = 'success';

      // Validate and potentially use the primary URL as website
      if (isLikelyCompanyWebsite(searchResult.primaryUrl)) {
        websiteFromGoogle = searchResult.primaryUrl;
      }

      // Try to infer industry from snippet
      inferredIndustry = inferIndustryFromSnippet(searchResult.snippet);
    }

    // Build enrichment data structure
    const enrichmentData: any = {
      source: 'google_cse',
      timestamp: new Date().toISOString(),
      searchQuery: company.name + (company.country ? ` ${company.country}` : ''),
      websiteFromGoogle,
      snippet: searchResult.snippet || null,
      inferredIndustry,
      rawResults: searchResult.rawItems || [],
      metadata: searchResult.metadata || null,
    };

    if (!searchResult.success) {
      enrichmentData.error = searchResult.error;
    }

    // Prepare update data
    const updateData: any = {
      enrichmentStatus,
      enrichmentLastRun: new Date(),
      enrichmentData,
    };

    // Optionally update company website if empty and we found a valid one
    // FUTURE EXTENSION: Make this behavior configurable (auto-update vs manual review)
    if (!company.website && websiteFromGoogle) {
      updateData.website = websiteFromGoogle;
    }

    // Optionally update industry if empty and we inferred one
    if (!company.industry && inferredIndustry) {
      updateData.industry = inferredIndustry;
    }

    // Update company in database
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    // Prepare enrichment summary for response
    const enrichmentSummary = {
      status: enrichmentStatus,
      websiteFound: !!websiteFromGoogle,
      websiteAutoFilled: !company.website && !!websiteFromGoogle,
      industryInferred: !!inferredIndustry,
      industryAutoFilled: !company.industry && !!inferredIndustry,
      source: 'google_cse',
      timestamp: new Date().toISOString(),
    };

    // FUTURE EXTENSION POINT: Trigger score recalculation for related leads
    // This would integrate with the scoring engine from Phase 5
    // Example: await recalculateLeadScores(companyId);

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      enrichmentSummary,
    });
  } catch (error: any) {
    console.error('Enrichment API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during enrichment.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
