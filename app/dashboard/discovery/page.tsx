import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DiscoveryClient from './components/DiscoveryClient';
import PageContainer from '../components/PageContainer';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DiscoveryPage() {
  // Check auth + admin role
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role?.toLowerCase();
  if (userRole !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch recent discovery runs
  const runs = await prisma.discoveryRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  // Serialize dates for client component
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
  }));

  return (
    <PageContainer>
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-700">
            Dashboard
          </Link>
          <span className="mx-2" aria-hidden="true">›</span>
          <Link href="/dashboard/discovery" className="hover:text-gray-700">
            Discovery
          </Link>
          <span className="mx-2" aria-hidden="true">›</span>
          <span>Manual</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">
          Manual Discovery
        </h1>
        <p className="text-gray-600 mt-1">
          Run targeted discovery using predefined intent templates
        </p>
      </div>

      <DiscoveryClient initialRuns={serializedRuns} />
    </PageContainer>
  );
}
