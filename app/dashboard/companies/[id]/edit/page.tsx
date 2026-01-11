import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import CompanyForm from "../../components/CompanyForm";

export default async function EditCompanyPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Await params to get the id
  const { id } = await props.params;

  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/dashboard/companies/${company.id}`}
            className="text-[#1B7A7A] hover:text-[#155555] text-sm"
          >
            ← Back to Company
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Company</h1>
          <CompanyForm company={company} mode="edit" />
        </div>
      </div>
    </div>
  );
}
