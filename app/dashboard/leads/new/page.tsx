import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LeadForm from "../components/LeadForm";

export default async function NewLeadPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/leads"
            className="text-[#1B7A7A] hover:text-[#155555] text-sm font-medium"
          >
            ← Back to Leads
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Lead</h1>
          <LeadForm mode="create" />
        </div>
      </div>
    </div>
  );
}
