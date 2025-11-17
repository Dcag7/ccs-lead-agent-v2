import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scoreLead, scoreCompany } from '@/lib/scoring';

/**
 * POST /api/scoring/recalculate
 * Recalculate scores for leads and/or companies
 * 
 * Body (optional):
 * - scope: "all" | "leads" | "companies" (default: "all")
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const scope = body.scope || 'all';

    // Validate scope
    if (!['all', 'leads', 'companies'].includes(scope)) {
      return NextResponse.json(
        { error: 'Invalid scope. Must be "all", "leads", or "companies"' },
        { status: 400 }
      );
    }

    let leadsUpdated = 0;
    let companiesUpdated = 0;
    const errors: string[] = [];

    // Recalculate lead scores
    if (scope === 'all' || scope === 'leads') {
      try {
        const leads = await prisma.lead.findMany({
          include: {
            companyRel: {
              select: {
                size: true,
              },
            },
          },
        });

        for (const lead of leads) {
          try {
            const { score, reasons } = scoreLead(lead);
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                score,
                scoreFactors: { reasons },
              },
            });
            leadsUpdated++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Lead ${lead.id}: ${errorMessage}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to fetch leads: ${errorMessage}`);
      }
    }

    // Recalculate company scores
    if (scope === 'all' || scope === 'companies') {
      try {
        const companies = await prisma.company.findMany({
          include: {
            _count: {
              select: {
                leads: true,
                contacts: true,
              },
            },
          },
        });

        for (const company of companies) {
          try {
            const { score, reasons } = scoreCompany(company);
            await prisma.company.update({
              where: { id: company.id },
              data: {
                score,
                scoreFactors: { reasons },
              },
            });
            companiesUpdated++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Company ${company.id}: ${errorMessage}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to fetch companies: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      leadsUpdated,
      companiesUpdated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Score recalculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
