import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DiscoveryRunResultsClient from './components/DiscoveryRunResultsClient';

export const dynamic = 'force-dynamic';

export default async function DiscoveryRunResultsPage(
  props: { params: Promise<{ runId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role?.toLowerCase();
  if (userRole !== 'admin') {
    redirect('/dashboard');
  }

  const { runId } = await props.params;

  const run = await prisma.discoveryRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    notFound();
  }

  // Parse results from JSON
  const resultsJson = (run as { resultsJson?: unknown }).resultsJson;
  const results = Array.isArray(resultsJson) ? resultsJson : [];
  const stats = (run.stats as Record<string, unknown>) || {};

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-gray-700">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <Link href="/dashboard/discovery" className="hover:text-gray-700">
              Discovery
            </Link>
            <span className="mx-2">/</span>
            <span>Run Results</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">
            Discovery Run Results
          </h1>
          <p className="text-gray-600 mt-1">
            {run.intentName || run.mode} - {new Date(run.startedAt).toLocaleString()}
          </p>
        </div>

        <DiscoveryRunResultsClient
          run={{
            id: run.id,
            status: run.status,
            dryRun: run.dryRun,
            intentId: run.intentId,
            intentName: run.intentName,
            startedAt: run.startedAt.toISOString(),
            finishedAt: run.finishedAt?.toISOString() ?? null,
            stats,
          }}
          results={results as Parameters<typeof DiscoveryRunResultsClient>[0]['results']}
        />
      </div>
    </div>
  );
}
