import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LeadsClient from "./components/LeadsClient";
import { Prisma } from "@prisma/client";
import Link from "next/link";

type LeadsSearchParams = {
  sortBy?: string;
  sortOrder?: string;
  minScore?: string;
  businessSource?: string;
};

type LeadWithRelations = Prisma.LeadGetPayload<{
  include: {
    companyRel: true;
    contactRel: true;
  };
}>;

export default async function LeadsPage(props: { 
  searchParams: Promise<LeadsSearchParams> 
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect("/login");
    }

    // Await and parse search params
    const { sortBy, sortOrder, minScore, businessSource } = await props.searchParams;
    
    const effectiveSortBy = sortBy || "createdAt";
    const effectiveSortOrder = sortOrder === "asc" ? "asc" : "desc";
    const effectiveMinScore = minScore ? parseInt(minScore, 10) : 0;
    const effectiveBusinessSource = businessSource || undefined;

    // Build orderBy clause
    const orderBy: any = {};
    if (effectiveSortBy === "score") {
      orderBy.score = effectiveSortOrder;
    } else if (effectiveSortBy === "createdAt") {
      orderBy.createdAt = effectiveSortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    // Build where clause
    const where: any = {
      status: { not: "archived" },
      score: { gte: effectiveMinScore },
    };
    if (effectiveBusinessSource) {
      where.businessSource = effectiveBusinessSource;
    }

    // Fetch all non-archived leads with related data
    let leads: LeadWithRelations[] = [];
    try {
      leads = await prisma.lead.findMany({
        where,
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
        currentBusinessSource={effectiveBusinessSource}
      />
    );
  } catch (error) {
    console.error("Leads page error:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Leads</h1>
          <p className="text-gray-600 mb-4">There was an error loading the leads page. Please try again.</p>
          <Link href="/dashboard/leads" className="text-blue-600 hover:text-blue-800">
            Refresh Page
          </Link>
        </div>
      </div>
    );
  }
}
