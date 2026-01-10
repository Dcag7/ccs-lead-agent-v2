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
    const orderBy: any = {};
    if (effectiveSortBy === "score") {
      orderBy.score = effectiveSortOrder;
    } else if (effectiveSortBy === "createdAt") {
      orderBy.createdAt = effectiveSortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    // Fetch all non-archived leads with related data
    let leads = [];
    try {
      leads = await prisma.lead.findMany({
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
    } catch (error) {
      console.error("Error fetching leads:", error);
      // Continue with empty array
    }

    return (
      <LeadsClient 
        leads={leads} 
        userEmail={session.user?.email || ''} 
        currentSort={{ sortBy: effectiveSortBy, sortOrder: effectiveSortOrder }} 
        currentMinScore={effectiveMinScore}
      />
    );
  } catch (error) {
    console.error("Leads page error:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Leads</h1>
          <p className="text-gray-600 mb-4">There was an error loading the leads page. Please try again.</p>
          <a href="/dashboard/leads" className="text-blue-600 hover:text-blue-800">
            Refresh Page
          </a>
        </div>
      </div>
    );
  }
}
