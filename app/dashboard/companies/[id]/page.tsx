import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import CompanyEnrichment from "../components/CompanyEnrichment";
import { rollupCompanyScore } from "@/lib/scoring/rollupCompanyScore";

export default async function CompanyDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Await params to get the id
  const { id } = await props.params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: { createdAt: "desc" },
      },
      leads: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          contacts: true,
          leads: true,
        },
      },
    },
  });

  if (!company) {
    notFound();
  }

  // Compute rollup score (computed on-read, not persisted)
  const rollupScore = await rollupCompanyScore(id);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/companies"
            className="text-[#1B7A7A] hover:text-[#155555] text-sm"
          >
            ← Back to Companies
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1B7A7A] hover:text-[#155555] text-sm"
                >
                  {company.website}
                </a>
              )}
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/companies/${company.id}/edit`}
                className="bg-[#1B7A7A] text-white px-4 py-2 rounded-lg hover:bg-[#155555] font-medium"
              >
                Edit
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Industry</h3>
              <p className="mt-1 text-gray-900">{company.industry || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Country</h3>
              <p className="mt-1 text-gray-900">{company.country || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Size</h3>
              <p className="mt-1 text-gray-900">{company.size || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Score</h3>
              <p className="mt-1 text-2xl font-bold text-[#1B7A7A]">{company.score}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-gray-900">
                {new Date(company.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Scoring Factors */}
          {company.scoreFactors && typeof company.scoreFactors === 'object' && 'reasons' in company.scoreFactors && Array.isArray((company.scoreFactors as { reasons?: unknown }).reasons) && ((company.scoreFactors as { reasons?: unknown[] }).reasons?.length ?? 0) > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Scoring Breakdown</h3>
              <div className="bg-[#E6F5F5] rounded-lg p-4">
                <ul className="space-y-2">
                  {((company.scoreFactors as { reasons?: string[] }).reasons ?? []).map((reason: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#1B7A7A] mr-2">✓</span>
                      <span className="text-sm text-gray-700">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Note: Scores are calculated based on rules-based factors. Future versions will include AI-enhanced scoring.
              </p>
            </div>
          )}

          {/* Lead Score Rollup */}
          {rollupScore.totalLeads > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Score Rollup</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#E6F5F5] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Average Score</h4>
                  <p className="text-2xl font-bold text-[#1B7A7A]">{rollupScore.avgScore.toFixed(1)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Max Score</h4>
                  <p className="text-2xl font-bold text-green-600">{rollupScore.maxScore}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Hot Leads</h4>
                  <p className="text-2xl font-bold text-red-600">{rollupScore.countHot}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Warm Leads</h4>
                  <p className="text-2xl font-bold text-yellow-600">{rollupScore.countWarm}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Cold Leads</h4>
                  <p className="text-xl font-semibold text-gray-700">{rollupScore.countCold}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Total Leads</h4>
                  <p className="text-xl font-semibold text-gray-700">{rollupScore.totalLeads}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Scored Leads</h4>
                  <p className="text-xl font-semibold text-gray-700">{rollupScore.scoredLeads}</p>
                </div>
              </div>
              {rollupScore.lastScoredAt && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500">
                    Last scored: {new Date(rollupScore.lastScoredAt).toLocaleString()}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3">
                Aggregate metrics computed from all non-archived leads for this company.
              </p>
            </div>
          )}
        </div>

        {/* Enrichment Panel */}
        <div className="mb-6">
          <CompanyEnrichment company={company} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Contacts ({company._count.contacts})
              </h2>
              <Link
                href={`/dashboard/contacts/new?companyId=${company.id}`}
                className="text-[#1B7A7A] hover:text-[#155555] text-sm font-medium"
              >
                Add Contact
              </Link>
            </div>
            {company.contacts.length === 0 ? (
              <p className="text-gray-600 text-sm">No contacts yet</p>
            ) : (
              <div className="space-y-3">
                {company.contacts.map((contact) => (
                  <div key={contact.id} className="border-b border-gray-200 pb-3 last:border-0">
                    <Link
                      href={`/dashboard/contacts/${contact.id}`}
                      className="text-[#1B7A7A] hover:text-[#155555] font-medium"
                    >
                      {contact.firstName} {contact.lastName}
                    </Link>
                    <p className="text-sm text-gray-600">{contact.email}</p>
                    {contact.role && (
                      <p className="text-xs text-gray-500">{contact.role}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Leads ({company._count.leads})
            </h2>
            {company.leads.length === 0 ? (
              <p className="text-gray-600 text-sm">No leads yet</p>
            ) : (
              <div className="space-y-3">
                {company.leads.map((lead) => (
                  <div key={lead.id} className="border-b border-gray-200 pb-3 last:border-0">
                    <p className="font-medium text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{lead.email}</p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-[#E6F5F5] text-[#1B7A7A] mt-1">
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
