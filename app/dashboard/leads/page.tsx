import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LeadsClient from "./components/LeadsClient";

type LeadsSearchParams = {
  sortBy?: string;
  sortOrder?: string;
  minScore?: string;
};

export default async function LeadsPage(props: { 
  searchParams: Promise<LeadsSearchParams> 
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Await and parse search params
  const { sortBy, sortOrder, minScore } = await props.searchParams;
  
  const effectiveSortBy = sortBy || "createdAt";
  const effectiveSortOrder = sortOrder === "asc" ? "asc" : "desc";
  const effectiveMinScore = minScore ? parseInt(minScore, 10) : 0;

  // Build orderBy clause
  const orderBy: any = {};
  if (effectiveSortBy === "score") {
    orderBy.score = effectiveSortOrder;
  } else if (effectiveSortBy === "createdAt") {
    orderBy.createdAt = effectiveSortOrder;
  } else {
    orderBy.createdAt = "desc";
  }

  // Fetch all non-archived leads with related data
  const leads = await prisma.lead.findMany({
    where: {
      status: { not: "archived" },
      score: { gte: effectiveMinScore },
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
      currentSort={{ sortBy: effectiveSortBy, sortOrder: effectiveSortOrder }} 
      currentMinScore={effectiveMinScore}
    />
  );
}
