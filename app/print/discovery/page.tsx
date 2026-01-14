import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

  // Serialize for client with resultsJson
  const serializedRuns = runs.map((run) => ({
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
    resultsJson: run.resultsJson as unknown[] | null,
  }));

  return <PrintViewClient runs={serializedRuns} />;
}
