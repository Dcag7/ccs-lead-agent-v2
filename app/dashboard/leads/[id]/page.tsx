
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteLeadButton from './DeleteLeadButton';

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
  });

  if (!lead) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/leads"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Leads
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {lead.firstName || lead.lastName
                    ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
                    : 'Lead Details'}
                </h1>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      lead.status === 'new'
                        ? 'bg-blue-100 text-blue-800'
                        : lead.status === 'contacted'
                        ? 'bg-yellow-100 text-yellow-800'
                        : lead.status === 'qualified'
                        ? 'bg-green-100 text-green-800'
                        : lead.status === 'archived'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {lead.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    Score: <span className="font-semibold">{lead.score}</span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/leads/${lead.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  Edit Lead
                </Link>
                <DeleteLeadButton leadId={lead.id} />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-8 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {lead.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm text-gray-900">
                      {lead.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Country</p>
                    <p className="text-sm text-gray-900">
                      {lead.country || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Business Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Company</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {lead.company || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Source</p>
                    <p className="text-sm text-gray-900">
                      {lead.source || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(lead.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(lead.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
