import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CompaniesClient from "./components/CompaniesClient";

type CompaniesSearchParams = {
  sortBy?: string;
  sortOrder?: string;
  minScore?: string;
};

export default async function CompaniesPage(props: { 
  searchParams: Promise<CompaniesSearchParams> 
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

  // Fetch all companies with counts
  const companies = await prisma.company.findMany({
    where: {
      score: { gte: effectiveMinScore },
    },
    include: {
      _count: {
        select: {
          contacts: true,
          leads: true,
        },
      },
    },
    orderBy,
  });

  return (
    <CompaniesClient
      companies={companies}
      userEmail={session.user?.email || ''}
      currentSort={{ sortBy: effectiveSortBy, sortOrder: effectiveSortOrder }}
      currentMinScore={effectiveMinScore}
    />
  );
}
