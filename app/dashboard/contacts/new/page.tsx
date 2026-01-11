
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ContactForm from "../components/ContactForm";

export default async function NewContactPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/contacts"
            className="text-[#1B7A7A] hover:text-[#155555] text-sm"
          >
            ← Back to Contacts
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Contact</h1>
          <ContactForm mode="create" />
        </div>
      </div>
    </div>
  );
}
