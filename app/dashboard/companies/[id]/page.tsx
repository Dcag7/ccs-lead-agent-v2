import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                CCS Lead Agent
              </Link>
              <div className="flex gap-4">
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/dashboard/companies" className="text-sm font-medium text-blue-600">
                  Companies
                </Link>
                <Link href="/dashboard/contacts" className="text-sm text-gray-600 hover:text-gray-900">
                  Contacts
                </Link>
                <Link href="/dashboard/leads" className="text-sm text-gray-600 hover:text-gray-900">
                  Leads
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <a
                href="/api/auth/signout"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/companies"
            className="text-blue-600 hover:text-blue-800 text-sm"
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
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {company.website}
                </a>
              )}
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/companies/${company.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
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
              <p className="mt-1 text-2xl font-bold text-blue-600">{company.score}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-gray-900">
                {new Date(company.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Scoring Factors */}
          {company.scoreFactors && typeof company.scoreFactors === 'object' && 'reasons' in company.scoreFactors && Array.isArray((company.scoreFactors as any).reasons) && (company.scoreFactors as any).reasons.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Scoring Breakdown</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <ul className="space-y-2">
                  {((company.scoreFactors as any).reasons as string[]).map((reason: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Contacts ({company._count.contacts})
              </h2>
              <Link
                href={`/dashboard/contacts/new?companyId=${company.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
                      className="text-blue-600 hover:text-blue-800 font-medium"
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
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 mt-1">
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
