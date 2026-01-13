'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
}

export default function CompaniesClient({
  companies,
  userEmail,
  currentSort,
  currentMinScore,
}: CompaniesClientProps) {
  const router = useRouter();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [minScore, setMinScore] = useState(currentMinScore);

  const handleSort = (field: string) => {
    const newOrder =
      currentSort.sortBy === field && currentSort.sortOrder === 'desc' ? 'asc' : 'desc';
    router.push(`/dashboard/companies?sortBy=${field}&sortOrder=${newOrder}&minScore=${minScore}`);
  };

  const handleMinScoreChange = (value: number) => {
    setMinScore(value);
    router.push(
      `/dashboard/companies?sortBy=${currentSort.sortBy}&sortOrder=${currentSort.sortOrder}&minScore=${value}`
    );
  };

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

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
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

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-600">Minimum Score:</label>
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
        </div>

        {companies.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-12 text-center">
            <h3 className="text-base font-semibold text-gray-900 mb-2">No companies found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {currentMinScore > 0
                ? `No companies with score >= ${currentMinScore}. Try adjusting the filter.`
                : 'Get started by adding your first company.'}
            </p>
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
      </div>
    </div>
  );
}
