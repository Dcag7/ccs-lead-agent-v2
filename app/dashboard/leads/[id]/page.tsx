import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LeadScoring from "../components/LeadScoring";
import LeadStatusManager from "./components/LeadStatusManager";
import LeadOwnerManager from "./components/LeadOwnerManager";
import LeadNotes from "./components/LeadNotes";

export default async function LeadDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Await params to get the id
  const { id } = await props.params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      companyRel: true,
      contactRel: true,
      assignedTo: true,
      notes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  // Fetch users for owner assignment
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      email: 'asc',
    },
  });

  const formatName = (firstName: string | null, lastName: string | null) => {
    if (firstName || lastName) {
      return `${firstName || ""} ${lastName || ""}`.trim();
    }
    return "Unnamed Lead";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      won: "bg-green-200 text-green-900",
      lost: "bg-red-100 text-red-800",
      archived: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

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
                <Link href="/dashboard/companies" className="text-sm text-gray-600 hover:text-gray-900">
                  Companies
                </Link>
                <Link href="/dashboard/contacts" className="text-sm text-gray-600 hover:text-gray-900">
                  Contacts
                </Link>
                <Link href="/dashboard/leads" className="text-sm font-medium text-blue-600">
                  Leads
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <Link
                href="/api/auth/signout"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/leads"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Leads
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatName(lead.firstName, lead.lastName)}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{lead.email}</p>
            </div>
            <div className="flex gap-3">
              {lead.status === "archived" && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                  Archived
                </span>
              )}
              <Link
                href={`/dashboard/leads/${lead.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
              >
                Edit Lead
              </Link>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">First Name</h3>
                <p className="text-gray-900">{lead.firstName || "-"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Last Name</h3>
                <p className="text-gray-900">{lead.lastName || "-"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <p className="text-gray-900">{lead.email}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                <p className="text-gray-900">{lead.phone || "-"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Country</h3>
                <p className="text-gray-900">{lead.country || "-"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    lead.status
                  )}`}
                >
                  {lead.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Score</h3>
                <p className="text-2xl font-bold text-blue-600">{lead.score}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Source</h3>
                <p className="text-gray-900">{lead.source || "-"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Company</h3>
                {lead.companyRel ? (
                  <Link
                    href={`/dashboard/companies/${lead.companyRel.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {lead.companyRel.name}
                  </Link>
                ) : (
                  <p className="text-gray-900">-</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Contact</h3>
                {lead.contactRel ? (
                  <Link
                    href={`/dashboard/contacts/${lead.contactRel.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {lead.contactRel.firstName || lead.contactRel.lastName
                      ? `${lead.contactRel.firstName || ""} ${lead.contactRel.lastName || ""}`.trim()
                      : lead.contactRel.email}
                  </Link>
                ) : (
                  <p className="text-gray-900">-</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
                <p className="text-gray-900">
                  {new Date(lead.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                <p className="text-gray-900">
                  {new Date(lead.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Phase 4A: Lead Management */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <LeadStatusManager leadId={lead.id} currentStatus={lead.status} />
                <LeadOwnerManager 
                  leadId={lead.id} 
                  currentAssignedToId={lead.assignedToId}
                  currentAssignedTo={lead.assignedTo}
                  users={users}
                  currentUserId={(session.user as { id?: string })?.id || null}
                />
              </div>

              <LeadNotes 
                leadId={lead.id} 
                notes={lead.notes}
                currentUserId={(session.user as { id?: string })?.id || null}
              />
            </div>

            {/* Lead Scoring Controls */}
            <LeadScoring
              leadId={lead.id}
              currentBusinessSource={lead.businessSource}
              currentScore={lead.score}
              currentClassification={lead.classification}
              currentScoredAt={lead.scoredAt}
            />

            {/* Scoring Factors - Top 5 */}
            {lead.scoreFactors &&
              typeof lead.scoreFactors === 'object' &&
              'all' in lead.scoreFactors &&
              Array.isArray((lead.scoreFactors as { all?: Array<{ name: string; points: number; explanation: string }> }).all) &&
              (lead.scoreFactors as { all: Array<{ name: string; points: number; explanation: string }> }).all.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Scoring Factors</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {(lead.scoreFactors as { all: Array<{ name: string; points: number; explanation: string }> }).all
                        .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
                        .slice(0, 5)
                        .map((factor, index) => (
                          <li key={index} className="flex items-start justify-between">
                            <div className="flex items-start">
                              <span className="text-blue-600 mr-2">✓</span>
                              <span className="text-sm text-gray-700">{factor.explanation}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 ml-4">
                              {factor.points > 0 ? '+' : ''}
                              {factor.points}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Note: Scores are calculated based on rules-based factors. Showing top 5 factors by points.
                  </p>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
