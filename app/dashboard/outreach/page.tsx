import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OutreachQueueClient from "./components/OutreachQueueClient";

export default async function OutreachQueuePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;

  // Fetch drafts
  const where: { status?: string; leadId?: string } = {};
  if (status && ["draft", "approved", "sent", "cancelled", "failed"].includes(status)) {
    where.status = status;
  }

  const drafts = await prisma.outreachDraft.findMany({
    where,
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
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Outreach Queue</h1>
        <OutreachQueueClient initialDrafts={drafts.map(d => ({...d, metadata: d.metadataJson as Record<string, unknown> | null, createdAt: d.createdAt.toISOString()}))} currentUserId={(session.user as { id?: string })?.id || null} />
      </div>
    </div>
  );
}
