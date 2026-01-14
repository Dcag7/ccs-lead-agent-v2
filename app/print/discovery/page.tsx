import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import PrintViewClient from '@/app/dashboard/discovery/print/components/PrintViewClient';

export const dynamic = 'force-dynamic';

export default async function DiscoveryPrintPage(
  props: { searchParams: Promise<{ ids?: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role?.toLowerCase();
  if (userRole !== 'admin') {
    redirect('/dashboard');
  }

  const { ids } = await props.searchParams;
  const runIds = ids ? ids.split(',').filter(Boolean) : [];

  if (runIds.length === 0) {
    return (
      <div className="p-8">
        <p className="text-gray-700">No runs selected for printing.</p>
      </div>
    );
  }

  // Fetch runs
  const runs = await prisma.discoveryRun.findMany({
    where: { id: { in: runIds } },
    orderBy: { startedAt: 'desc' },
  });

  // Serialize for client with resultsJson and fallback for created companies
  const serializedRuns = await Promise.all(runs.map(async (run) => {
    let resultsJson = run.resultsJson as unknown[] | null;
    
    // Fallback: if resultsJson is empty but we have created companies, fetch them
    if ((!resultsJson || !Array.isArray(resultsJson) || resultsJson.length === 0) && run.createdCompaniesCount > 0) {
      // Fetch companies created by this run (companies with discovery metadata)
      const companies = await prisma.company.findMany({
        where: {
          discoveryMetadata: {
            not: Prisma.JsonNull,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: run.createdCompaniesCount,
      });

      // Convert companies to DiscoveryResult format for display
      resultsJson = companies.map((company) => {
        const metadata = company.discoveryMetadata as {
          discoverySource?: string;
          discoveryTimestamp?: string;
          relevanceScore?: number;
          relevanceReasons?: string[];
          channel?: string;
          scrapedDescription?: string;
        } | null;

        return {
          type: 'company' as const,
          name: company.name,
          website: company.website || undefined,
          industry: company.industry || undefined,
          country: company.country || undefined,
          description: metadata?.scrapedDescription || undefined,
          discoveryMetadata: {
            discoverySource: metadata?.discoverySource || 'unknown',
            discoveryTimestamp: metadata?.discoveryTimestamp || company.createdAt.toISOString(),
            additionalMetadata: {
              relevanceScore: metadata?.relevanceScore,
              relevanceReasons: metadata?.relevanceReasons,
              channel: metadata?.channel,
            },
          },
        };
      });
    }

    return {
      id: run.id,
      status: run.status,
      mode: run.mode,
      dryRun: run.dryRun,
      intentId: run.intentId,
      intentName: run.intentName,
      triggeredBy: run.triggeredBy,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      createdCompaniesCount: run.createdCompaniesCount,
      createdContactsCount: run.createdContactsCount,
      createdLeadsCount: run.createdLeadsCount,
      skippedCount: run.skippedCount,
      errorCount: run.errorCount,
      stats: run.stats as Record<string, unknown> | null,
      error: run.error,
      resultsJson,
    };
  }));

  return <PrintViewClient runs={serializedRuns} />;
}
