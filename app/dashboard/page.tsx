
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

  // Fetch lead statistics
  const totalLeads = await prisma.lead.count({
    where: {
      status: {
        not: 'archived',
      },
    },
  });

  const newLeads = await prisma.lead.count({
    where: {
      status: 'new',
    },
  });

  const qualifiedLeads = await prisma.lead.count({
    where: {
      status: 'qualified',
    },
  });

  const conversionRate = totalLeads > 0 
    ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">CCS Lead Agent</h1>
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/leads"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome back, {session.user?.name || session.user?.email}!
          </h2>
          <p className="text-gray-600 mb-4">
            You have successfully logged in to the CCS Lead Agent platform.
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/leads"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              View Leads
            </Link>
            <Link
              href="/dashboard/leads/new"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              + Add New Lead
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/leads" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Leads</h3>
            <p className="text-3xl font-bold text-blue-600">{totalLeads}</p>
            <p className="text-sm text-gray-500 mt-1">
              {totalLeads === 0 ? 'No leads yet' : 'Active leads in system'}
            </p>
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New Leads</h3>
            <p className="text-3xl font-bold text-yellow-600">{newLeads}</p>
            <p className="text-sm text-gray-500 mt-1">
              {newLeads === 0 ? 'All leads contacted' : 'Awaiting contact'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Qualified</h3>
            <p className="text-3xl font-bold text-green-600">{qualifiedLeads}</p>
            <p className="text-sm text-gray-500 mt-1">
              {qualifiedLeads === 0 ? 'No qualified leads yet' : 'Ready for conversion'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion Rate</h3>
            <p className="text-3xl font-bold text-purple-600">{conversionRate}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {totalLeads === 0 ? 'Start adding leads' : 'Qualified / Total'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/leads"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <h4 className="font-semibold text-gray-900 mb-1">Manage Leads</h4>
              <p className="text-sm text-gray-600">View and manage all your leads</p>
            </Link>
            <Link
              href="/dashboard/leads/new"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
            >
              <h4 className="font-semibold text-gray-900 mb-1">Add New Lead</h4>
              <p className="text-sm text-gray-600">Create a new lead entry</p>
            </Link>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-50">
              <h4 className="font-semibold text-gray-900 mb-1">Campaigns (Coming Soon)</h4>
              <p className="text-sm text-gray-600">Launch automated campaigns</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
