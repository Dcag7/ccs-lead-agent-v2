
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ContactDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Await params to get the id
  const { id } = await props.params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      leads: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          leads: true,
        },
      },
    },
  });

  if (!contact) {
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
                <Link href="/dashboard/companies" className="text-sm text-gray-600 hover:text-gray-900">
                  Companies
                </Link>
                <Link href="/dashboard/contacts" className="text-sm font-medium text-blue-600">
                  Contacts
                </Link>
                <Link href="/dashboard/leads" className="text-sm text-gray-600 hover:text-gray-900">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/contacts"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Contacts
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {contact.firstName} {contact.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{contact.email}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/contacts/${contact.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Edit
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1 text-gray-900">{contact.phone || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <p className="mt-1 text-gray-900">{contact.role || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Company</h3>
              {contact.company ? (
                <Link
                  href={`/dashboard/companies/${contact.company.id}`}
                  className="mt-1 text-blue-600 hover:text-blue-800 inline-block"
                >
                  {contact.company.name}
                </Link>
              ) : (
                <p className="mt-1 text-gray-900">-</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-gray-900">
                {new Date(contact.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Leads ({contact._count.leads})
          </h2>
          {contact.leads.length === 0 ? (
            <p className="text-gray-600 text-sm">No leads yet</p>
          ) : (
            <div className="space-y-3">
              {contact.leads.map((lead) => (
                <div key={lead.id} className="border-b border-gray-200 pb-3 last:border-0">
                  <p className="font-medium text-gray-900">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{lead.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {lead.status}
                    </span>
                    {lead.score > 0 && (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Score: {lead.score}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
