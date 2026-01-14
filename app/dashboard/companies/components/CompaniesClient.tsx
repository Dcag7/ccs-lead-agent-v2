'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  size: string | null;
  score: number;
  createdAt: Date;
  _count: {
    contacts: number;
    leads: number;
  };
}

interface CompaniesClientProps {
  companies: Company[];
  userEmail: string;
  currentSort: { sortBy: string; sortOrder: string };
  currentMinScore: number;
  search: string;
  country: string;
  industry: string;
  size: string;
  hasLeads: string;
  hasContacts: string;
  filterOptions: {
    countries: string[];
    industries: string[];
    sizes: string[];
  };
}

export default function CompaniesClient({
  companies,
  currentSort,
  currentMinScore,
  search: initialSearch,
  country: initialCountry,
  industry: initialIndustry,
  size: initialSize,
  hasLeads: initialHasLeads,
  hasContacts: initialHasContacts,
  filterOptions,
}: CompaniesClientProps) {
  const router = useRouter();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [minScore, setMinScore] = useState(currentMinScore);
  const [search, setSearch] = useState(initialSearch);
  const [country, setCountry] = useState(initialCountry);
  const [industry, setIndustry] = useState(initialIndustry);
  const [size, setSize] = useState(initialSize);
  const [hasLeads, setHasLeads] = useState(initialHasLeads);
  const [hasContacts, setHasContacts] = useState(initialHasContacts);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Update URL with current filters
  const updateURL = () => {
    const params = new URLSearchParams();
    
    if (currentSort.sortBy) params.set('sortBy', currentSort.sortBy);
    if (currentSort.sortOrder) params.set('sortOrder', currentSort.sortOrder);
    if (minScore > 0) params.set('minScore', minScore.toString());
    if (search) params.set('search', search);
    if (country) params.set('country', country);
    if (industry) params.set('industry', industry);
    if (size) params.set('size', size);
    if (hasLeads) params.set('hasLeads', hasLeads);
    if (hasContacts) params.set('hasContacts', hasContacts);

    router.push(`/dashboard/companies?${params.toString()}`);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== initialSearch) {
        const params = new URLSearchParams();
        if (currentSort.sortBy) params.set('sortBy', currentSort.sortBy);
        if (currentSort.sortOrder) params.set('sortOrder', currentSort.sortOrder);
        if (minScore > 0) params.set('minScore', minScore.toString());
        if (search) params.set('search', search);
        if (country) params.set('country', country);
        if (industry) params.set('industry', industry);
        if (size) params.set('size', size);
        if (hasLeads) params.set('hasLeads', hasLeads);
        if (hasContacts) params.set('hasContacts', hasContacts);
        router.push(`/dashboard/companies?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Handle filter changes
  const handleFilterChange = () => {
    updateURL();
  };

  const handleSort = (field: string) => {
    const newOrder =
      currentSort.sortBy === field && currentSort.sortOrder === 'desc' ? 'asc' : 'desc';
    router.push(`/dashboard/companies?sortBy=${field}&sortOrder=${newOrder}&minScore=${minScore}${search ? `&search=${encodeURIComponent(search)}` : ''}${country ? `&country=${encodeURIComponent(country)}` : ''}${industry ? `&industry=${encodeURIComponent(industry)}` : ''}${size ? `&size=${encodeURIComponent(size)}` : ''}${hasLeads ? `&hasLeads=${hasLeads}` : ''}${hasContacts ? `&hasContacts=${hasContacts}` : ''}`);
  };

  const handleMinScoreChange = (value: number) => {
    setMinScore(value);
    router.push(
      `/dashboard/companies?sortBy=${currentSort.sortBy}&sortOrder=${currentSort.sortOrder}&minScore=${value}${search ? `&search=${encodeURIComponent(search)}` : ''}${country ? `&country=${encodeURIComponent(country)}` : ''}${industry ? `&industry=${encodeURIComponent(industry)}` : ''}${size ? `&size=${encodeURIComponent(size)}` : ''}${hasLeads ? `&hasLeads=${hasLeads}` : ''}${hasContacts ? `&hasContacts=${hasContacts}` : ''}`
    );
  };

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const response = await fetch('/api/scoring/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'companies' }),
      });

      if (!response.ok) {
        throw new Error('Failed to recalculate scores');
      }

      const result = await response.json();
      alert(`Successfully recalculated scores for ${result.companiesUpdated} companies!`);
      router.refresh();
    } catch (error) {
      alert('Error recalculating scores. Please try again.');
      console.error('Recalculation error:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const getSortIcon = (field: string) => {
    if (currentSort.sortBy !== field) return '↕';
    return currentSort.sortOrder === 'desc' ? '↓' : '↑';
  };

  const clearFilters = () => {
    setSearch('');
    setCountry('');
    setIndustry('');
    setSize('');
    setHasLeads('');
    setHasContacts('');
    setMinScore(0);
    router.push(`/dashboard/companies?sortBy=${currentSort.sortBy}&sortOrder=${currentSort.sortOrder}`);
  };

  const hasActiveFilters = search || country || industry || size || hasLeads || hasContacts || minScore > 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-[95rem] mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and explore company data</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRecalculating ? 'Recalculating...' : 'Recalculate Scores'}
              </button>
              <Link
                href="/dashboard/companies/new"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-md hover:from-emerald-600 hover:to-teal-700 text-sm font-medium transition-all"
              >
                Add Company
              </Link>
            </div>
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <div 
          ref={filterBarRef}
          className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 mb-6 sticky top-4 z-10"
        >
          {/* Search */}
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, website, or industry..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Filters Grid - All on one row with wrapping */}
          <div className="flex flex-wrap gap-3">
            {/* Country Filter */}
            <div className="flex-1 min-w-[140px] max-w-[180px]">
              <label htmlFor="country" className="block text-xs font-medium text-gray-600 mb-1">
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All</option>
                {filterOptions.countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Industry Filter */}
            <div className="flex-1 min-w-[140px] max-w-[180px]">
              <label htmlFor="industry" className="block text-xs font-medium text-gray-600 mb-1">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All</option>
                {filterOptions.industries.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div className="flex-1 min-w-[120px] max-w-[150px]">
              <label htmlFor="size" className="block text-xs font-medium text-gray-600 mb-1">
                Size
              </label>
              <select
                id="size"
                value={size}
                onChange={(e) => {
                  setSize(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All</option>
                {filterOptions.sizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Has Leads Filter */}
            <div className="flex-1 min-w-[100px] max-w-[120px]">
              <label htmlFor="hasLeads" className="block text-xs font-medium text-gray-600 mb-1">
                Has Leads
              </label>
              <select
                id="hasLeads"
                value={hasLeads}
                onChange={(e) => {
                  setHasLeads(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Has Contacts Filter */}
            <div className="flex-1 min-w-[110px] max-w-[130px]">
              <label htmlFor="hasContacts" className="block text-xs font-medium text-gray-600 mb-1">
                Has Contacts
              </label>
              <select
                id="hasContacts"
                value={hasContacts}
                onChange={(e) => {
                  setHasContacts(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {/* Min Score and Clear Filters */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Min Score:</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minScore}
                onChange={(e) => handleMinScoreChange(parseInt(e.target.value))}
                className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-sm font-medium text-gray-900 min-w-[50px]">
                {minScore}+
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-12 text-center">
            <h3 className="text-base font-semibold text-gray-900 mb-2">No companies found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {hasActiveFilters
                ? 'No companies match your filters. Try adjusting your search criteria.'
                : 'Get started by adding your first company.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm font-medium mr-2"
              >
                Clear Filters
              </button>
            )}
            <Link
              href="/dashboard/companies/new"
              className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-md hover:from-emerald-600 hover:to-teal-700 text-sm font-medium"
            >
              Add Company
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('score')}
                    >
                      Score {getSortIcon('score')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-emerald-50/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/companies/${company.id}`}
                          className="text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          {company.name}
                        </Link>
                        {company.website && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                            {company.website}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {company.industry || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {company.country || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {company.size || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{company.score}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {company._count.contacts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {company._count.leads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/dashboard/companies/${company.id}/edit`}
                          className="text-emerald-600 hover:text-emerald-700 mr-4"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/companies/${company.id}`}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-colors z-20"
            aria-label="Back to top"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
