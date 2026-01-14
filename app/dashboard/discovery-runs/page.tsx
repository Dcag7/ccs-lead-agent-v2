import { prisma } from '@/lib/prisma';
import DiscoveryRunsClient from './components/DiscoveryRunsClient';
import PageContainer from '../components/PageContainer';
import Breadcrumbs from '../components/Breadcrumbs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DiscoveryRunsPage() {
  // Fetch recent discovery runs (excluding archived by default)
  const runs = await prisma.discoveryRun.findMany({
    where: { archivedAt: null },
    orderBy: { startedAt: 'desc' },
    take: 50,
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
    cancelRequestedAt: run.cancelRequestedAt?.toISOString() ?? null,
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
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumbs
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Discovery', href: '/dashboard/discovery' },
                { label: 'Automated' },
              ]}
            />
            <h1 className="text-3xl font-bold text-gray-900">
              Automated Discovery
            </h1>
            <p className="text-gray-600 mt-1">
              History of scheduled and manual discovery runs
            </p>
          </div>
          <Link
            href="/dashboard/discovery"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
          >
            Run Manual Discovery
          </Link>
        </div>
      </div>

      <DiscoveryRunsClient initialRuns={serializedRuns} />
    </PageContainer>
  );
}
