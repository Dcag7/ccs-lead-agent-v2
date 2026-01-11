
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
    let totalContacts = 0;

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
      totalContacts = results[4].status === "fulfilled" ? results[4].value : 0;
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      // Continue with default values of 0
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
                <Link href="/dashboard" className="text-sm font-medium text-blue-600">
                  Dashboard
                </Link>
                <Link href="/dashboard/companies" className="text-sm text-gray-600 hover:text-gray-900">
                  Companies
                </Link>
                <Link href="/dashboard/contacts" className="text-sm text-gray-600 hover:text-gray-900">
                  Contacts
                </Link>
                <Link href="/dashboard/leads" className="text-sm text-gray-600 hover:text-gray-900">
                  Leads
                </Link>
                <Link href="/dashboard/imports" className="text-sm text-gray-600 hover:text-gray-900">
                  Imports
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome back, {session.user?.name || session.user?.email}!
          </h2>
          <p className="text-gray-600">
            You have successfully logged in to the CCS Lead Agent platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Leads</h3>
            <p className="text-3xl font-bold text-purple-600">{totalLeads}</p>
            <Link href="/dashboard/leads" className="text-sm text-purple-600 hover:text-purple-800 mt-2 inline-block">
              View all leads →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New Leads</h3>
            <p className="text-3xl font-bold text-blue-600">{newLeads}</p>
            <p className="text-sm text-gray-500 mt-1">
              Last 7 days
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Qualified Leads</h3>
            <p className="text-3xl font-bold text-green-600">{qualifiedLeads}</p>
            <p className="text-sm text-gray-500 mt-1">
              In progress
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Companies</h3>
            <p className="text-3xl font-bold text-orange-600">{totalCompanies}</p>
            <Link href="/dashboard/companies" className="text-sm text-orange-600 hover:text-orange-800 mt-2 inline-block">
              View companies →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/leads/new"
              className="flex items-center justify-center bg-purple-600 text-white px-6 py-4 rounded-md hover:bg-purple-700 font-medium"
            >
              <span className="mr-2">+</span> Add Lead
            </Link>
            <Link
              href="/dashboard/companies/new"
              className="flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-md hover:bg-blue-700 font-medium"
            >
              <span className="mr-2">+</span> Add Company
            </Link>
            <Link
              href="/dashboard/contacts/new"
              className="flex items-center justify-center bg-green-600 text-white px-6 py-4 rounded-md hover:bg-green-700 font-medium"
            >
              <span className="mr-2">+</span> Add Contact
            </Link>
            <Link
              href="/dashboard/leads"
              className="flex items-center justify-center bg-gray-600 text-white px-6 py-4 rounded-md hover:bg-gray-700 font-medium"
            >
              View All Leads
            </Link>
          </div>
        </div>
      </main>
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
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Refresh Page
          </Link>
        </div>
      </div>
    );
  }
}
