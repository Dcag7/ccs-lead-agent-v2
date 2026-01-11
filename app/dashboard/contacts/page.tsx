import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Prisma } from "@prisma/client";

type ContactWithCompany = Prisma.ContactGetPayload<{
  include: {
    company: true;
    _count: {
      select: {
        leads: true;
      };
    };
  };
}>;

export default async function ContactsPage() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect("/login");
    }

    // Fetch all contacts with company and lead counts
    let contacts: ContactWithCompany[] = [];
    try {
      contacts = await prisma.contact.findMany({
        include: {
          company: true,
          _count: {
            select: {
              leads: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      console.error("Error fetching contacts:", error);
      // Continue with empty array
    }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
              <p className="text-gray-600 mt-1">Manage and track your contacts</p>
            </div>
            <Link
              href="/dashboard/contacts/new"
              className="bg-[#1B7A7A] text-white px-4 py-2 rounded-lg hover:bg-[#155555] font-medium shadow-sm hover:shadow-md transition-all"
            >
              Add Contact
            </Link>
          </div>
        </div>

        {contacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first contact.</p>
            <Link
              href="/dashboard/contacts/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Add Contact
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
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
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
                        className="text-[#1B7A7A] hover:text-[#155555] font-medium"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contact.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contact.role || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contact.company ? (
                        <Link
                          href={`/dashboard/companies/${contact.company.id}`}
                          className="text-[#1B7A7A] hover:text-[#155555]"
                        >
                          {contact.company.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contact._count.leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/contacts/${contact.id}/edit`}
                        className="text-[#1B7A7A] hover:text-[#155555] mr-4"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
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
      </div>
    </div>
  );
  } catch (error) {
    console.error("Contacts page error:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Contacts</h1>
          <p className="text-gray-600 mb-4">There was an error loading the contacts page. Please try again.</p>
          <Link href="/dashboard/contacts" className="text-[#1B7A7A] hover:text-[#155555]">
            Refresh Page
          </Link>
        </div>
      </div>
    );
  }
}
