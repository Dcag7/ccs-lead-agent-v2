/**
 * API: Create companies from discovery results
 * POST /api/discovery/create-from-results
 * 
 * Creates Company records from selected discovery results (e.g., from a preview run).
 * Deduplicates by website domain first, then by company name.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ResultToCreate {
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;
  industry?: string;
  relevanceScore?: number;
  channel?: string;
}

interface RequestBody {
  runId: string;
  results: ResultToCreate[];
}

export async function POST(request: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const userRole = (session.user as { role?: string }).role?.toLowerCase();
  if (userRole !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  // Parse body
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { runId, results } = body;

  if (!runId || !results || !Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ success: false, error: 'runId and non-empty results array required' }, { status: 400 });
  }

  // Verify the run exists
  const run = await prisma.discoveryRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return NextResponse.json({ success: false, error: 'Discovery run not found' }, { status: 404 });
  }

  let companiesCreated = 0;
  let companiesSkipped = 0;
  const errors: string[] = [];

  for (const result of results) {
    if (!result.name && !result.website) {
      errors.push('Skipped result: missing both name and website');
      companiesSkipped++;
      continue;
    }

    try {
      // Check for existing company by website domain
      let existingCompany = null;
      
      if (result.website) {
        // Normalize website for comparison
        const normalizedWebsite = result.website.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        existingCompany = await prisma.company.findFirst({
          where: {
            OR: [
              { website: result.website },
              { website: { contains: normalizedWebsite, mode: 'insensitive' } },
            ],
          },
        });
      }

      // Fallback: check by name
      if (!existingCompany && result.name) {
        existingCompany = await prisma.company.findFirst({
          where: {
            name: { equals: result.name, mode: 'insensitive' },
          },
        });
      }

      if (existingCompany) {
        companiesSkipped++;
        continue;
      }

      // Create company
      await prisma.company.create({
        data: {
          name: result.name || new URL(result.website!).hostname.replace('www.', ''),
          website: result.website || null,
          industry: result.industry || null,
          score: result.relevanceScore ? Math.round(result.relevanceScore) : 0,
          discoveryMetadata: {
            discoverySource: result.channel || 'manual',
            discoveryTimestamp: new Date().toISOString(),
            discoveryMethod: 'created_from_preview',
            runId: runId,
            originalScore: result.relevanceScore,
          },
        },
      });

      companiesCreated++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to create "${result.name}": ${msg}`);
      companiesSkipped++;
    }
  }

  return NextResponse.json({
    success: true,
    companiesCreated,
    companiesSkipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
