
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome to your lead generation command center</p>
          </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Leads</h3>
              <div className="w-10 h-10 bg-[#E6F5F5] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1B7A7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{totalLeads}</p>
            <p className="text-sm text-[#1B7A7A] font-medium">+12% from last month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Active Leads</h3>
              <div className="w-10 h-10 bg-[#E6F5F5] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{qualifiedLeads}</p>
            <p className="text-sm text-[#1B7A7A] font-medium">{totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0}% of total</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Outreach Sent</h3>
              <div className="w-10 h-10 bg-[#E6F5F5] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#0FA5A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">0</p>
            <p className="text-sm text-gray-500">0 this week</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Avg Lead Score</h3>
              <div className="w-10 h-10 bg-[#E6F5F5] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1B7A7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">0</p>
            <p className="text-sm text-[#1B7A7A] font-medium">+5 points from last month</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
          <p className="text-gray-600 mb-6">Common tasks to manage your lead generation workflow</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/dashboard/leads/new"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E6F5F5] rounded-lg flex items-center justify-center group-hover:bg-[#1B7A7A] transition-colors">
                  <svg className="w-6 h-6 text-[#1B7A7A] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Add New Lead</h3>
                  <p className="text-sm text-gray-500">Manually add a new lead to your pipeline</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/imports"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E6F5F5] rounded-lg flex items-center justify-center group-hover:bg-[#1B7A7A] transition-colors">
                  <svg className="w-6 h-6 text-[#10B981] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Import Leads</h3>
                  <p className="text-sm text-gray-500">Upload CSV or JSON file with lead data</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/leads"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E6F5F5] rounded-lg flex items-center justify-center group-hover:bg-[#1B7A7A] transition-colors">
                  <svg className="w-6 h-6 text-[#0FA5A5] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Send Outreach</h3>
                  <p className="text-sm text-gray-500">Create and send email campaigns</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/companies"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E6F5F5] rounded-lg flex items-center justify-center group-hover:bg-[#1B7A7A] transition-colors">
                  <svg className="w-6 h-6 text-[#1B7A7A] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Generate Research</h3>
                  <p className="text-sm text-gray-500">Trigger automated lead research</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/companies"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E6F5F5] rounded-lg flex items-center justify-center group-hover:bg-[#1B7A7A] transition-colors">
                  <svg className="w-6 h-6 text-[#0FA5A5] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">HubSpot Sync</h3>
                  <p className="text-sm text-gray-500">Export leads to HubSpot CRM</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:border-[#1B7A7A]/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E6F5F5] rounded-lg flex items-center justify-center group-hover:bg-[#1B7A7A] transition-colors">
                  <svg className="w-6 h-6 text-[#1B7A7A] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Configuration</h3>
                  <p className="text-sm text-gray-500">Update SMTP and system settings</p>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h1>
          <p className="text-gray-600 mb-4">There was an error loading the dashboard. Please try again.</p>
          <Link href="/dashboard" className="text-[#1B7A7A] hover:text-[#155555]">
            Refresh Page
          </Link>
        </div>
      </div>
    );
  }
}
