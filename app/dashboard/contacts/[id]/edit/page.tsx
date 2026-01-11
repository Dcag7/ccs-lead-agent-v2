
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactForm from "../../components/ContactForm";

export default async function EditContactPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Await params to get the id
  const { id } = await props.params;

  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/dashboard/contacts/${contact.id}`}
            className="text-[#1B7A7A] hover:text-[#155555] text-sm"
          >
            ← Back to Contact
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Contact</h1>
          <ContactForm contact={contact} mode="edit" />
        </div>
      </div>
    </div>
  );
}
