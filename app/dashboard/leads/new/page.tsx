
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import LeadForm from '../components/LeadForm';

export default async function NewLeadPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
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
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Create New Lead</h1>
            <p className="text-gray-600 mt-1">
              Add a new lead to your CRM system
            </p>
          </div>

          <div className="px-8 py-6">
            <LeadForm />
          </div>
        </div>
      </div>
    </div>
  );
}
