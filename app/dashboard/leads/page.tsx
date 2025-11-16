import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LeadsClient from "./components/LeadsClient";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { sortBy?: string; sortOrder?: string; minScore?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Parse search params
  const sortBy = searchParams.sortBy || "createdAt";
  const sortOrder = searchParams.sortOrder || "desc";
  const minScore = searchParams.minScore ? parseInt(searchParams.minScore) : 0;

  // Build orderBy clause
  const orderBy: any = {};
  if (sortBy === "score") {
    orderBy.score = sortOrder;
  } else if (sortBy === "createdAt") {
    orderBy.createdAt = sortOrder;
  } else {
    orderBy.createdAt = "desc";
  }

  // Fetch all non-archived leads with related data
  const leads = await prisma.lead.findMany({
    where: {
      status: { not: "archived" },
      score: { gte: minScore },
    },
    include: {
      companyRel: true,
      contactRel: true,
    },
    orderBy,
  });

  return (
    <LeadsClient 
      leads={leads} 
      userEmail={session.user?.email || ''} 
      currentSort={{ sortBy, sortOrder }} 
      currentMinScore={minScore}
    />
  );
}
