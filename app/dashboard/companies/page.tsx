import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CompaniesClient from "./components/CompaniesClient";
import { Prisma } from "@prisma/client";
import Link from "next/link";

export const dynamic = 'force-dynamic';

type CompaniesSearchParams = {
  sortBy?: string;
  sortOrder?: string;
  minScore?: string;
  search?: string;
  country?: string;
  industry?: string;
  size?: string;
  hasLeads?: string;
  hasContacts?: string;
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
    const { sortBy, sortOrder, minScore, search, country, industry, size, hasLeads, hasContacts } = await props.searchParams;
    
    const effectiveSortBy = sortBy || "createdAt";
    const effectiveSortOrder = sortOrder === "asc" ? "asc" : "desc";
    const effectiveMinScore = minScore ? parseInt(minScore, 10) : 0;

    // Build orderBy clause
    const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
    if (effectiveSortBy === "score") {
      orderBy.score = effectiveSortOrder;
    } else if (effectiveSortBy === "createdAt") {
      orderBy.createdAt = effectiveSortOrder;
    } else if (effectiveSortBy === "name") {
      orderBy.name = effectiveSortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    // Build where clause
    const where: Prisma.CompanyWhereInput = {
      score: { gte: effectiveMinScore },
    };

    // Text search (name, website, industry)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Country filter
    if (country) {
      where.country = country;
    }

    // Industry filter
    if (industry) {
      where.industry = industry;
    }

    // Size filter
    if (size) {
      where.size = size;
    }

    // Has leads filter
    if (hasLeads === 'true') {
      where.leads = { some: {} };
    } else if (hasLeads === 'false') {
      where.leads = { none: {} };
    }

    // Has contacts filter
    if (hasContacts === 'true') {
      where.contacts = { some: {} };
    } else if (hasContacts === 'false') {
      where.contacts = { none: {} };
    }

    // Fetch companies with counts
    let companies: CompanyWithCounts[] = [];
    try {
      companies = await prisma.company.findMany({
        where,
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

    // Fetch unique filter values for dropdowns
    let countries: string[] = [];
    let industries: string[] = [];
    let sizes: string[] = [];
    try {
      const allCompanies = await prisma.company.findMany({
        select: {
          country: true,
          industry: true,
          size: true,
        },
      });

      countries = [...new Set(allCompanies.map(c => c.country).filter(Boolean) as string[])].sort();
      industries = [...new Set(allCompanies.map(c => c.industry).filter(Boolean) as string[])].sort();
      sizes = [...new Set(allCompanies.map(c => c.size).filter(Boolean) as string[])].sort();
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }

    return (
      <CompaniesClient
        companies={companies}
        userEmail={session.user?.email || ''}
        currentSort={{ sortBy: effectiveSortBy, sortOrder: effectiveSortOrder }}
        currentMinScore={effectiveMinScore}
        search={search || ''}
        country={country || ''}
        industry={industry || ''}
        size={size || ''}
        hasLeads={hasLeads || ''}
        hasContacts={hasContacts || ''}
        filterOptions={{ countries, industries, sizes }}
      />
    );
  } catch (error) {
    console.error("Companies page error:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Companies</h1>
          <p className="text-gray-600 mb-4">There was an error loading the companies page. Please try again.</p>
          <Link href="/dashboard/companies" className="text-[#1B7A7A] hover:text-[#155555]">
            Refresh Page
          </Link>
        </div>
      </div>
    );
  }
}
