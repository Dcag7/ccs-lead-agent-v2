import { prisma } from '@/lib/prisma';
import PageContainer from '@/app/dashboard/components/PageContainer';
import Breadcrumbs from '@/app/dashboard/components/Breadcrumbs';
import ArchivedRunsClient from './components/ArchivedRunsClient';

export const dynamic = 'force-dynamic';

export default async function ArchivedRunsPage() {
  // Fetch only archived runs
  const runs = await prisma.discoveryRun.findMany({
    where: { archivedAt: { not: null } },
    orderBy: { startedAt: 'desc' },
    take: 100,
  });

  // Serialize dates for client component
  const serializedRuns = runs.map((run) => ({
    id: run.id,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    status: run.status,
    mode: run.mode,
    dryRun: run.dryRun,
    triggeredBy: run.triggeredBy,
    intentId: run.intentId,
    intentName: run.intentName,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    archivedAt: run.archivedAt?.toISOString() ?? null,
    stats: run.stats as Record<string, unknown> | null,
    error: run.error,
    createdCompaniesCount: run.createdCompaniesCount,
    createdContactsCount: run.createdContactsCount,
    createdLeadsCount: run.createdLeadsCount,
    skippedCount: run.skippedCount,
    errorCount: run.errorCount,
  }));

  return (
    <PageContainer>
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Discovery', href: '/dashboard/discovery' },
            { label: 'Archived Runs' },
          ]}
        />
        <h1 className="text-3xl font-bold text-gray-900">
          Archived Discovery Runs
        </h1>
        <p className="text-gray-600 mt-1">
          View and manage archived discovery runs. Deleted runs cannot be recovered.
        </p>
      </div>

      <ArchivedRunsClient initialRuns={serializedRuns} />
    </PageContainer>
  );
}
