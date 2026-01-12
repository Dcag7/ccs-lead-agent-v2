import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DraftEditorClient from "./components/DraftEditorClient";

export default async function DraftDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await props.params;

  const draft = await prisma.outreachDraft.findUnique({
    where: { id },
    include: {
      playbook: {
        select: {
          id: true,
          name: true,
          audienceType: true,
        },
      },
      lead: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyRel: {
            select: {
              name: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!draft) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/outreach"
            className="text-[#1B7A7A] hover:text-[#155555] text-sm font-medium"
          >
            ← Back to Outreach Queue
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Edit Draft</h1>
            <p className="text-sm text-gray-600 mt-1">
              Playbook: {draft.playbook.name} • Lead: {draft.lead.email}
            </p>
          </div>

          <DraftEditorClient draft={{...draft, metadata: draft.metadataJson as Record<string, unknown> | null, createdAt: draft.createdAt.toISOString()}} currentUserId={(session.user as { id?: string })?.id || null} />
        </div>
      </div>
    </div>
  );
}
