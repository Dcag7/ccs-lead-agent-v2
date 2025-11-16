
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch statistics
  const [totalLeads, totalCompanies, totalContacts] = await Promise.all([
    prisma.lead.count(),
    prisma.company.count(),
    prisma.contact.count(),
  ]);

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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome back, {session.user?.name || session.user?.email}!
          </h2>
          <p className="text-gray-600">
            You have successfully logged in to the CCS Lead Agent platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Companies</h3>
            <p className="text-3xl font-bold text-blue-600">{totalCompanies}</p>
            <Link href="/dashboard/companies" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
              View all companies →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Contacts</h3>
            <p className="text-3xl font-bold text-green-600">{totalContacts}</p>
            <Link href="/dashboard/contacts" className="text-sm text-green-600 hover:text-green-800 mt-2 inline-block">
              View all contacts →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Leads</h3>
            <p className="text-3xl font-bold text-purple-600">{totalLeads}</p>
            <p className="text-sm text-gray-500 mt-1">
              {totalLeads === 0 ? "No leads yet" : "Active leads in pipeline"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              href="/dashboard/companies"
              className="flex items-center justify-center bg-gray-600 text-white px-6 py-4 rounded-md hover:bg-gray-700 font-medium"
            >
              View All Companies
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
