/**
 * Phase 4B: Lead Management - Filter Parsing and Prisma Query Building
 * 
 * Utilities for parsing URL query params into typed filter objects
 * and building Prisma where/orderBy clauses.
 */

import type { Prisma } from '@prisma/client';

/**
 * Parsed lead filters from URL query params
 */
export interface LeadFilters {
  status?: string[];
  assignedToId?: string | 'unassigned';
  classification?: string[];
  businessSource?: string[];
  minScore?: number;
  maxScore?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  companyCountry?: string[];
  companyIndustry?: string[];
  companySize?: string[];
}

/**
 * Sort configuration
 */
export interface LeadSort {
  sortBy: 'score' | 'updatedAt' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

/**
 * Parse URL search params into typed LeadFilters
 * 
 * URL param format examples:
 * - ?status=new&status=qualified (multi-select)
 * - ?assignedToId=unassigned
 * - ?minScore=50&maxScore=100
 * - ?createdAfter=2024-01-01&createdBefore=2024-12-31
 * - ?companyCountry=US&companyCountry=CA
 * 
 * Invalid values are silently ignored (resilient parsing)
 */
export function parseLeadFilters(searchParams: URLSearchParams): LeadFilters {
  const filters: LeadFilters = {};

  // Status (multi-select)
  const statusValues = searchParams.getAll('status').filter(Boolean);
  if (statusValues.length > 0) {
    filters.status = statusValues;
  }

  // Assigned to (single: 'unassigned' or user ID)
  const assignedToId = searchParams.get('assignedToId');
  if (assignedToId) {
    if (assignedToId === 'unassigned') {
      filters.assignedToId = 'unassigned';
    } else {
      filters.assignedToId = assignedToId;
    }
  }

  // Classification (multi-select)
  const classificationValues = searchParams.getAll('classification').filter(Boolean);
  if (classificationValues.length > 0) {
    filters.classification = classificationValues;
  }

  // Business source (multi-select)
  const businessSourceValues = searchParams.getAll('businessSource').filter(Boolean);
  if (businessSourceValues.length > 0) {
    filters.businessSource = businessSourceValues;
  }

  // Score range
  const minScoreStr = searchParams.get('minScore');
  if (minScoreStr) {
    const minScore = parseInt(minScoreStr, 10);
    if (!isNaN(minScore) && minScore >= 0 && minScore <= 100) {
      filters.minScore = minScore;
    }
  }

  const maxScoreStr = searchParams.get('maxScore');
  if (maxScoreStr) {
    const maxScore = parseInt(maxScoreStr, 10);
    if (!isNaN(maxScore) && maxScore >= 0 && maxScore <= 100) {
      filters.maxScore = maxScore;
    }
  }

  // Date ranges
  const createdAfterStr = searchParams.get('createdAfter');
  if (createdAfterStr) {
    const date = new Date(createdAfterStr);
    if (!isNaN(date.getTime())) {
      filters.createdAfter = date;
    }
  }

  const createdBeforeStr = searchParams.get('createdBefore');
  if (createdBeforeStr) {
    const date = new Date(createdBeforeStr);
    if (!isNaN(date.getTime())) {
      filters.createdBefore = date;
    }
  }

  const updatedAfterStr = searchParams.get('updatedAfter');
  if (updatedAfterStr) {
    const date = new Date(updatedAfterStr);
    if (!isNaN(date.getTime())) {
      filters.updatedAfter = date;
    }
  }

  const updatedBeforeStr = searchParams.get('updatedBefore');
  if (updatedBeforeStr) {
    const date = new Date(updatedBeforeStr);
    if (!isNaN(date.getTime())) {
      filters.updatedBefore = date;
    }
  }

  // Company filters (multi-select)
  const companyCountryValues = searchParams.getAll('companyCountry').filter(Boolean);
  if (companyCountryValues.length > 0) {
    filters.companyCountry = companyCountryValues;
  }

  const companyIndustryValues = searchParams.getAll('companyIndustry').filter(Boolean);
  if (companyIndustryValues.length > 0) {
    filters.companyIndustry = companyIndustryValues;
  }

  const companySizeValues = searchParams.getAll('companySize').filter(Boolean);
  if (companySizeValues.length > 0) {
    filters.companySize = companySizeValues;
  }

  return filters;
}

/**
 * Build Prisma LeadWhereInput from LeadFilters
 * 
 * Handles:
 * - Multi-select filters (status, classification, businessSource, company attributes)
 * - Single filters (assignedToId)
 * - Range filters (score, dates)
 * - Company relation filters (via companyRel)
 */
export function buildLeadWhere(
  filters: LeadFilters,
  options?: { includeArchived?: boolean }
): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};

  // Status (multi-select: OR condition)
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  } else if (!options?.includeArchived) {
    // Default: exclude archived unless explicitly included
    where.status = { not: 'archived' };
  }

  // Assigned to
  if (filters.assignedToId !== undefined) {
    if (filters.assignedToId === 'unassigned') {
      where.assignedToId = null;
    } else {
      where.assignedToId = filters.assignedToId;
    }
  }

  // Classification (multi-select: OR condition)
  if (filters.classification && filters.classification.length > 0) {
    where.classification = { in: filters.classification };
  }

  // Business source (multi-select: OR condition)
  if (filters.businessSource && filters.businessSource.length > 0) {
    where.businessSource = { in: filters.businessSource };
  }

  // Score range
  if (filters.minScore !== undefined || filters.maxScore !== undefined) {
    where.score = {};
    if (filters.minScore !== undefined) {
      where.score.gte = filters.minScore;
    }
    if (filters.maxScore !== undefined) {
      where.score.lte = filters.maxScore;
    }
  }

  // Date ranges
  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      where.createdAt.gte = filters.createdAfter;
    }
    if (filters.createdBefore) {
      where.createdAt.lte = filters.createdBefore;
    }
  }

  if (filters.updatedAfter || filters.updatedBefore) {
    where.updatedAt = {};
    if (filters.updatedAfter) {
      where.updatedAt.gte = filters.updatedAfter;
    }
    if (filters.updatedBefore) {
      where.updatedAt.lte = filters.updatedBefore;
    }
  }

  // Company filters (via relation)
  // Only apply if at least one company filter is set
  const hasCompanyFilters =
    (filters.companyCountry && filters.companyCountry.length > 0) ||
    (filters.companyIndustry && filters.companyIndustry.length > 0) ||
    (filters.companySize && filters.companySize.length > 0);

  if (hasCompanyFilters) {
    where.companyRel = {};
    const companyWhere: Prisma.CompanyWhereInput = {};

    if (filters.companyCountry && filters.companyCountry.length > 0) {
      companyWhere.country = { in: filters.companyCountry };
    }

    if (filters.companyIndustry && filters.companyIndustry.length > 0) {
      companyWhere.industry = { in: filters.companyIndustry };
    }

    if (filters.companySize && filters.companySize.length > 0) {
      companyWhere.size = { in: filters.companySize };
    }

    where.companyRel = companyWhere;
  }

  return where;
}

/**
 * Build Prisma LeadOrderByWithRelationInput from sort config
 */
export function buildLeadOrderBy(sort: LeadSort): Prisma.LeadOrderByWithRelationInput {
  const orderBy: Prisma.LeadOrderByWithRelationInput = {};

  switch (sort.sortBy) {
    case 'score':
      orderBy.score = sort.sortOrder;
      break;
    case 'updatedAt':
      orderBy.updatedAt = sort.sortOrder;
      break;
    case 'createdAt':
      orderBy.createdAt = sort.sortOrder;
      break;
    default:
      // Fallback to createdAt desc
      orderBy.createdAt = 'desc';
  }

  return orderBy;
}

/**
 * Parse sort from URL search params
 */
export function parseLeadSort(searchParams: URLSearchParams): LeadSort {
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');

  const validSortBy = ['score', 'updatedAt', 'createdAt'] as const;
  const validSortOrder = ['asc', 'desc'] as const;

  return {
    sortBy: (sortBy && validSortBy.includes(sortBy as 'score' | 'updatedAt' | 'createdAt')) ? (sortBy as 'score' | 'updatedAt' | 'createdAt') : 'createdAt',
    sortOrder: (sortOrder && validSortOrder.includes(sortOrder as 'asc' | 'desc')) ? (sortOrder as 'asc' | 'desc') : 'desc',
  };
}
