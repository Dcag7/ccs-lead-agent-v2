import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CompaniesClient from "./components/CompaniesClient";

export default async function CompaniesPage({
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

  // Fetch all companies with counts
  const companies = await prisma.company.findMany({
    where: {
      score: { gte: minScore },
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
      currentSort={{ sortBy, sortOrder }}
      currentMinScore={minScore}
    />
  );
}
