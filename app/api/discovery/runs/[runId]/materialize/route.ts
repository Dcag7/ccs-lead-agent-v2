/**
 * POST /api/discovery/runs/[runId]/materialize
 *
 * Materializes a dry-run discovery run by creating Company/Contact/Lead records
 * from the stored resultsJson. Updates the SAME run (does not create a new run).
 *
 * Requires admin auth.
 * Requires run to be dryRun=true and have resultsJson.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { persistDiscoveryResults } from '@/lib/discovery/persistDiscoveryResults';
import type { DiscoveryResult } from '@/lib/discovery/types';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ runId: string }> }
): Promise<NextResponse> {
  try {
    // 1. Authentication check - ensure JSON response
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Admin role check
    const userRole = (session.user as { role?: string }).role?.toLowerCase();
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'forbidden' },
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Get runId from params
    const { runId } = await props.params;

    console.log(`[Materialize] Starting materialization for runId: ${runId}`);

    // 4. Fetch and validate run
    const run = await prisma.discoveryRun.findUnique({
      where: { id: runId },
    });

    if (!run) {
      console.error(`[Materialize] Run not found: ${runId}`);
      return NextResponse.json(
        { success: false, error: 'Discovery run not found' },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 5. Validate run is dryRun
    if (!run.dryRun) {
      console.error(`[Materialize] Run ${runId} is not a dry-run (dryRun=${run.dryRun})`);
      return NextResponse.json(
        { success: false, error: 'Run is not a dry-run. Only dry-run runs can be materialized.' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 6. Validate resultsJson exists and is non-empty
    const resultsJson = run.resultsJson;
    if (!resultsJson || !Array.isArray(resultsJson) || resultsJson.length === 0) {
      console.error(`[Materialize] Run ${runId} has no resultsJson or empty array`);
      return NextResponse.json(
        { success: false, error: 'No results found in this run. Cannot materialize empty results.' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Materialize] Run ${runId} has ${resultsJson.length} results in resultsJson`);

    // 7. Parse resultsJson as DiscoveryResult[]
    let results: DiscoveryResult[];
    try {
      results = resultsJson as unknown as DiscoveryResult[];
    } catch (error) {
      console.error(`[Materialize] Invalid resultsJson format for run ${runId}:`, error);
      return NextResponse.json(
        { success: false, error: 'Invalid resultsJson format' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 8. Materialize results (create records idempotently)
    console.log(`[Materialize] Persisting ${results.length} discovery results for run ${runId}`);
    const persistenceResult = await persistDiscoveryResults(results);

    console.log(`[Materialize] Persistence complete for run ${runId}:`, {
      companiesCreated: persistenceResult.companiesCreated,
      companiesSkipped: persistenceResult.companiesSkipped,
      contactsCreated: persistenceResult.contactsCreated,
      contactsSkipped: persistenceResult.contactsSkipped,
      leadsCreated: persistenceResult.leadsCreated,
      leadsSkipped: persistenceResult.leadsSkipped,
      errors: persistenceResult.errors.length,
    });

    // 9. Update the SAME run record (NOT creating a new run)
    const skippedCount = persistenceResult.companiesSkipped + persistenceResult.contactsSkipped + persistenceResult.leadsSkipped;
    console.log(`[Materialize] Updating run ${runId} (same run, not creating new):`, {
      dryRun: false,
      createdCompaniesCount: persistenceResult.companiesCreated,
      createdContactsCount: persistenceResult.contactsCreated,
      createdLeadsCount: persistenceResult.leadsCreated,
      skippedCount,
    });

    const updatedRun = await prisma.discoveryRun.update({
      where: { id: runId },
      data: {
        dryRun: false, // Mark as materialized
        status: persistenceResult.success ? 'completed' : 'completed_with_errors',
        createdCompaniesCount: persistenceResult.companiesCreated,
        createdContactsCount: persistenceResult.contactsCreated,
        createdLeadsCount: persistenceResult.leadsCreated,
        skippedCount,
        errorCount: persistenceResult.errors.length,
        // Update finishedAt if not already set
        finishedAt: run.finishedAt || new Date(),
      },
    });

    console.log(`[Materialize] Successfully updated run ${runId}. Updated run dryRun=${updatedRun.dryRun}, createdCompaniesCount=${updatedRun.createdCompaniesCount}`);

    // 10. Return success response with explicit content-type
    return NextResponse.json({
      success: true,
      runId: updatedRun.id,
      stats: {
        companiesCreated: persistenceResult.companiesCreated,
        companiesSkipped: persistenceResult.companiesSkipped,
        contactsCreated: persistenceResult.contactsCreated,
        contactsSkipped: persistenceResult.contactsSkipped,
        leadsCreated: persistenceResult.leadsCreated,
        leadsSkipped: persistenceResult.leadsSkipped,
        errors: persistenceResult.errors.length,
      },
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Materialize] Error:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
