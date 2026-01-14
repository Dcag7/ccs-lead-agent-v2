import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import PageContainer from '@/app/dashboard/components/PageContainer';
import Breadcrumbs from '@/app/dashboard/components/Breadcrumbs';
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

  // Determine breadcrumb path based on run mode/triggeredBy
  const isManual = run.mode === 'manual' || run.triggeredBy === 'manual';
  const discoveryType = isManual ? 'Manual' : 'Automated';
  const discoveryHref = isManual ? '/dashboard/discovery' : '/dashboard/discovery-runs';

  // Parse results from JSON
  const resultsJson = (run as { resultsJson?: unknown }).resultsJson;
  let results = Array.isArray(resultsJson) ? resultsJson : [];
  
  // If resultsJson is empty but we have created companies, fetch them
  if (results.length === 0 && run.createdCompaniesCount > 0) {
    // Fetch companies created by this run
    // Note: We fetch recent companies with discovery metadata
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
    results = companies.map((company) => {
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

  const stats = (run.stats as Record<string, unknown>) || {};

  return (
    <PageContainer>
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Discovery', href: '/dashboard/discovery' },
            { label: discoveryType, href: discoveryHref },
            { label: 'Results' },
          ]}
        />
        <h1 className="text-3xl font-bold text-gray-900">
          Discovery Run Results
        </h1>
      </div>

      {/* Banner explaining preview vs saved results */}
      {run.dryRun ? (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-1">
                Preview Results (Dry Run)
              </h3>
              <p className="text-sm text-amber-800">
                This is a preview of discovered results. No records have been created in the database. 
                You can select results and create companies manually, or re-run this discovery as a real run to create records automatically.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-emerald-900 mb-1">
                Saved Results (Created Records)
              </h3>
              <p className="text-sm text-emerald-800">
                This run created {run.createdCompaniesCount} companies, {run.createdContactsCount} contacts, and {run.createdLeadsCount} leads. 
                {results.length === 0 && run.createdCompaniesCount > 0 && ' Results shown below are fetched from created records.'}
              </p>
            </div>
          </div>
        </div>
      )}

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
          createdCompaniesCount: run.createdCompaniesCount,
          createdLeadsCount: run.createdLeadsCount,
        }}
        results={results}
      />
    </PageContainer>
  );
}
