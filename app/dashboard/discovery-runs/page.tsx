import { prisma } from '@/lib/prisma';
import DiscoveryRunsClient from './components/DiscoveryRunsClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DiscoveryRunsPage() {
  // Fetch recent discovery runs
  const runs = await prisma.discoveryRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  // Serialize dates for client component
  const serializedRuns = runs.map((run) => ({
    ...run,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    stats: run.stats as {
      companiesCreated?: number;
      contactsCreated?: number;
      leadsCreated?: number;
      durationMs?: number;
    } | null,
  }));

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="text-sm text-gray-500 mb-2">
                <Link href="/dashboard" className="hover:text-gray-700">
                  Dashboard
                </Link>
                <span className="mx-2">/</span>
                <span>Discovery Runs</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900">
                Discovery Runs
              </h1>
              <p className="text-gray-600 mt-1">
                Autonomous daily discovery run history (Phase 5A)
              </p>
            </div>
          </div>
        </div>

        <DiscoveryRunsClient initialRuns={serializedRuns} />
      </div>
    </div>
  );
}
