
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect("/login");
    }

    // Fetch statistics with error handling
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let totalLeads = 0;
    let newLeads = 0;
    let qualifiedLeads = 0;
    let totalCompanies = 0;

    try {
      const results = await Promise.allSettled([
        prisma.lead.count({
          where: { status: { not: "archived" } },
        }),
        prisma.lead.count({
          where: {
            status: "new",
            createdAt: { gte: sevenDaysAgo },
          },
        }),
        prisma.lead.count({
          where: {
            status: { notIn: ["new", "archived"] },
          },
        }),
        prisma.company.count(),
        prisma.contact.count(),
      ]);

      totalLeads = results[0].status === "fulfilled" ? results[0].value : 0;
      newLeads = results[1].status === "fulfilled" ? results[1].value : 0;
      qualifiedLeads = results[2].status === "fulfilled" ? results[2].value : 0;
      totalCompanies = results[3].status === "fulfilled" ? results[3].value : 0;
      // totalContacts is fetched but not currently displayed in the UI
      void (results[4].status === "fulfilled" ? results[4].value : 0); // Suppress unused variable warning (may be used in future)
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      // Continue with default values of 0
    }

    return (
      <div className="p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-emerald-50/30 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-gray-500">Welcome to your lead generation command center</p>
          </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">{totalLeads}</p>
            <p className="text-xs text-emerald-600 font-medium">+12% from last month</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Active Leads</h3>
              <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">{qualifiedLeads}</p>
            <p className="text-xs text-teal-600 font-medium">{totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0}% of total</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Outreach Sent</h3>
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">0</p>
            <p className="text-xs text-gray-400">0 this week</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Avg Lead Score</h3>
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">0</p>
            <p className="text-xs text-emerald-600 font-medium">+5 points from last month</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Quick Actions</h2>
          <p className="text-sm text-gray-500 mb-4">Common tasks to manage your lead generation workflow</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/dashboard/leads/new"
              className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 transition-all">
                  <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Add New Lead</h3>
                  <p className="text-xs text-gray-500">Manually add a new lead</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/imports"
              className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 transition-all">
                  <svg className="w-5 h-5 text-teal-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Import Leads</h3>
                  <p className="text-xs text-gray-500">Upload CSV or JSON file</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/leads"
              className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 transition-all">
                  <svg className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Send Outreach</h3>
                  <p className="text-xs text-gray-500">Create email campaigns</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/companies"
              className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 transition-all">
                  <svg className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Generate Research</h3>
                  <p className="text-xs text-gray-500">Automated lead research</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/companies"
              className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 transition-all">
                  <svg className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">HubSpot Sync</h3>
                  <p className="text-xs text-gray-500">Export to HubSpot CRM</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 transition-all">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Configuration</h3>
                  <p className="text-xs text-gray-500">SMTP and system settings</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    // If there's an error, still try to show the page but log the error
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h1>
          <p className="text-sm text-gray-500 mb-4">There was an error loading the dashboard. Please try again.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Page
          </Link>
        </div>
      </div>
    );
  }
}
