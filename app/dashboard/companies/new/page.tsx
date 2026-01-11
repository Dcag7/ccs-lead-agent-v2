import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CompanyForm from "../components/CompanyForm";

export default async function NewCompanyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/companies"
            className="text-[#1B7A7A] hover:text-[#155555] text-sm"
          >
            ← Back to Companies
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Company</h1>
          <CompanyForm mode="create" />
        </div>
      </div>
    </div>
  );
}
