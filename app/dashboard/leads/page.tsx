import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LeadsClient from "./components/LeadsClient";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import {
  parseLeadFilters,
  parseLeadSort,
  buildLeadWhere,
  buildLeadOrderBy,
} from "@/lib/lead-management/filters";

export const dynamic = 'force-dynamic';

type LeadWithRelations = Prisma.LeadGetPayload<{
  include: {
    companyRel: true;
    contactRel: true;
    assignedTo: true;
  };
}>;

export default async function LeadsPage(props: { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect("/login");
    }

    // Await search params and convert to URLSearchParams for parsing
    const rawParams = await props.searchParams;
    const searchParams = new URLSearchParams();
    
    // Convert search params to URLSearchParams format
    // Handle both single and array values (for multi-select filters)
    for (const [key, value] of Object.entries(rawParams)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }

    // Parse filters and sort using utilities
    const filters = parseLeadFilters(searchParams);
    const sort = parseLeadSort(searchParams);

    // Build Prisma queries
    const where = buildLeadWhere(filters);
    const orderBy = buildLeadOrderBy(sort);

    // Fetch all non-archived leads with related data
    let leads: LeadWithRelations[] = [];
    try {
      leads = await prisma.lead.findMany({
        where,
        include: {
          companyRel: true,
          contactRel: true,
          assignedTo: true,
        },
        orderBy,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching leads';
      console.error("Error fetching leads:", errorMessage);
      // Continue with empty array
    }

    // Fetch users for owner filter
    let users: Array<{ id: string; name: string | null; email: string }> = [];
    try {
      users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          email: 'asc',
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching users';
      console.error("Error fetching users:", errorMessage);
      // Continue with empty array
    }

    // Fetch unique company filter values for dropdowns
    let companyCountries: string[] = [];
    let companyIndustries: string[] = [];
    let companySizes: string[] = [];
    try {
      const companies = await prisma.company.findMany({
        select: {
          country: true,
          industry: true,
          size: true,
        },
        where: {
          leads: {
            some: {},
          },
        },
      });

      companyCountries = [...new Set(companies.map(c => c.country).filter(Boolean) as string[])].sort();
      companyIndustries = [...new Set(companies.map(c => c.industry).filter(Boolean) as string[])].sort();
      companySizes = [...new Set(companies.map(c => c.size).filter(Boolean) as string[])].sort();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching company filters';
      console.error("Error fetching company filters:", errorMessage);
      // Continue with empty arrays
    }

    return (
      <LeadsClient 
        leads={leads} 
        users={users}
        userEmail={session.user?.email || ''} 
        filters={filters}
        sort={sort}
        companyCountries={companyCountries}
        companyIndustries={companyIndustries}
        companySizes={companySizes}
      />
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Leads page error:", errorMessage);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Leads</h1>
          <p className="text-gray-600 mb-4">There was an error loading the leads page. Please try again.</p>
          <Link href="/dashboard/leads" className="text-[#1B7A7A] hover:text-[#155555]">
            Refresh Page
          </Link>
        </div>
      </div>
    );
  }
}
