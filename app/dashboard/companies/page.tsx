import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CompaniesClient from "./components/CompaniesClient";
import { Prisma } from "@prisma/client";
import Link from "next/link";

type CompaniesSearchParams = {
  sortBy?: string;
  sortOrder?: string;
  minScore?: string;
};

type CompanyWithCounts = Prisma.CompanyGetPayload<{
  include: {
    _count: {
      select: {
        contacts: true;
        leads: true;
      };
    };
  };
}>;

export default async function CompaniesPage(props: { 
  searchParams: Promise<CompaniesSearchParams> 
}) {
  try {
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
    const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
    if (effectiveSortBy === "score") {
      orderBy.score = effectiveSortOrder;
    } else if (effectiveSortBy === "createdAt") {
      orderBy.createdAt = effectiveSortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    // Fetch all companies with counts
    let companies: CompanyWithCounts[] = [];
    try {
      companies = await prisma.company.findMany({
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
    } catch (error) {
      console.error("Error fetching companies:", error);
      // Continue with empty array
    }

    return (
      <CompaniesClient
        companies={companies}
        userEmail={session.user?.email || ''}
        currentSort={{ sortBy: effectiveSortBy, sortOrder: effectiveSortOrder }}
        currentMinScore={effectiveMinScore}
      />
    );
  } catch (error) {
    console.error("Companies page error:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Companies</h1>
          <p className="text-gray-600 mb-4">There was an error loading the companies page. Please try again.</p>
          <Link href="/dashboard/companies" className="text-blue-600 hover:text-blue-800">
            Refresh Page
          </Link>
        </div>
      </div>
    );
  }
}
