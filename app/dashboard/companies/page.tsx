import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch all companies with counts
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          contacts: true,
          leads: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

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
                <Link href="/dashboard/imports" className="text-sm text-gray-600 hover:text-gray-900">
                  Imports
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <Link
            href="/dashboard/companies/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            Add Company
          </Link>
        </div>

        {companies.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first company.</p>
            <Link
              href="/dashboard/companies/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Add Company
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/companies/${company.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {company.industry || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {company.country || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {company.size || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {company._count.contacts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {company._count.leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/companies/${company.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/companies/${company.id}`}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
