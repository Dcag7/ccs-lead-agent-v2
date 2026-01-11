'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import type { LeadFilters, LeadSort } from '@/lib/lead-management/filters';
import { ALLOWED_STATUSES } from '@/lib/lead-management/types';

interface Lead {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  country: string | null;
  status: string;
  score: number;
  classification: string | null;
  source: string | null;
  businessSource: string | null;
  createdAt: Date;
  updatedAt: Date;
  companyRel: {
    id: string;
    name: string;
    country: string | null;
    industry: string | null;
    size: string | null;
  } | null;
  contactRel: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface LeadsClientProps {
  leads: Lead[];
  users: Array<{ id: string; name: string | null; email: string }>;
  userEmail: string;
  filters: LeadFilters;
  sort: LeadSort;
  companyCountries: string[];
  companyIndustries: string[];
  companySizes: string[];
}

export default function LeadsClient({
  leads,
  users,
  userEmail,
  filters: initialFilters,
  sort: initialSort,
  companyCountries,
  companyIndustries,
  companySizes,
}: LeadsClientProps) {
  const router = useRouter();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<{
    type: 'archive' | 'unarchive' | 'status' | 'assign' | 'unassign';
    value?: string;
  } | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Local filter state (for UI controls)
  const [localFilters, setLocalFilters] = useState<LeadFilters>(initialFilters);
  const [localSort, setLocalSort] = useState<LeadSort>(initialSort);

  // Sync local state with props when they change
  useMemo(() => {
    setLocalFilters(initialFilters);
    setLocalSort(initialSort);
  }, [initialFilters, initialSort]);

  const formatName = (firstName: string | null, lastName: string | null) => {
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return '-';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-green-200 text-green-900',
      lost: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getClassificationColor = (classification: string | null) => {
    switch (classification) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-yellow-100 text-yellow-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Update URL with current filters and sort
  const updateURL = (newFilters: LeadFilters, newSort: LeadSort) => {
    const params = new URLSearchParams();

    // Add filters
    if (newFilters.status && newFilters.status.length > 0) {
      newFilters.status.forEach(s => params.append('status', s));
    }
    if (newFilters.assignedToId !== undefined) {
      params.append('assignedToId', newFilters.assignedToId);
    }
    if (newFilters.classification && newFilters.classification.length > 0) {
      newFilters.classification.forEach(c => params.append('classification', c));
    }
    if (newFilters.businessSource && newFilters.businessSource.length > 0) {
      newFilters.businessSource.forEach(bs => params.append('businessSource', bs));
    }
    if (newFilters.minScore !== undefined) {
      params.append('minScore', newFilters.minScore.toString());
    }
    if (newFilters.maxScore !== undefined) {
      params.append('maxScore', newFilters.maxScore.toString());
    }
    if (newFilters.createdAfter) {
      params.append('createdAfter', newFilters.createdAfter.toISOString().split('T')[0]);
    }
    if (newFilters.createdBefore) {
      params.append('createdBefore', newFilters.createdBefore.toISOString().split('T')[0]);
    }
    if (newFilters.updatedAfter) {
      params.append('updatedAfter', newFilters.updatedAfter.toISOString().split('T')[0]);
    }
    if (newFilters.updatedBefore) {
      params.append('updatedBefore', newFilters.updatedBefore.toISOString().split('T')[0]);
    }
    if (newFilters.companyCountry && newFilters.companyCountry.length > 0) {
      newFilters.companyCountry.forEach(cc => params.append('companyCountry', cc));
    }
    if (newFilters.companyIndustry && newFilters.companyIndustry.length > 0) {
      newFilters.companyIndustry.forEach(ci => params.append('companyIndustry', ci));
    }
    if (newFilters.companySize && newFilters.companySize.length > 0) {
      newFilters.companySize.forEach(cs => params.append('companySize', cs));
    }

    // Add sort
    params.append('sortBy', newSort.sortBy);
    params.append('sortOrder', newSort.sortOrder);

    router.push(`/dashboard/leads?${params.toString()}`);
  };

  const handleFilterChange = (updates: Partial<LeadFilters>) => {
    const newFilters = { ...localFilters, ...updates };
    setLocalFilters(newFilters);
    updateURL(newFilters, localSort);
  };

  const handleSortChange = (updates: Partial<LeadSort>) => {
    const newSort = { ...localSort, ...updates };
    setLocalSort(newSort);
    updateURL(localFilters, newSort);
  };

  const clearFilters = () => {
    const emptyFilters: LeadFilters = {};
    const defaultSort: LeadSort = { sortBy: 'createdAt', sortOrder: 'desc' };
    setLocalFilters(emptyFilters);
    setLocalSort(defaultSort);
    updateURL(emptyFilters, defaultSort);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(new Set(leads.map(l => l.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    const newSet = new Set(selectedLeadIds);
    if (checked) {
      newSet.add(leadId);
    } else {
      newSet.delete(leadId);
    }
    setSelectedLeadIds(newSet);
  };

  const handleBulkAction = async (action: typeof pendingBulkAction) => {
    if (!action || selectedLeadIds.size === 0) return;

    setIsBulkActionLoading(true);
    setBulkActionError(null);

    try {
      const leadIds = Array.from(selectedLeadIds);
      let updates: { status?: string; assignedToId?: string | null } = {};

      switch (action.type) {
        case 'archive':
          updates = { status: 'archived' };
          break;
        case 'unarchive':
          updates = { status: 'new' };
          break;
        case 'status':
          if (action.value) {
            updates = { status: action.value };
          }
          break;
        case 'assign':
          if (action.value) {
            updates = { assignedToId: action.value };
          }
          break;
        case 'unassign':
          updates = { assignedToId: null };
          break;
      }

      const response = await fetch('/api/leads/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds, updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Bulk operation failed');
      }

      const result = await response.json();
      if (result.errors && result.errors.length > 0) {
        setBulkActionError(`Updated ${result.updated} leads. ${result.errors.length} errors occurred.`);
      } else {
        setBulkActionError(null);
      }

      // Clear selection and refresh
      setSelectedLeadIds(new Set());
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setBulkActionError(errorMessage);
    } finally {
      setIsBulkActionLoading(false);
      setShowArchiveConfirm(false);
      setPendingBulkAction(null);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const response = await fetch('/api/scoring/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'leads' }),
      });

      if (!response.ok) {
        throw new Error('Failed to recalculate scores');
      }

      const result = await response.json();
      alert(`Successfully recalculated scores for ${result.leadsUpdated} leads!`);
      router.refresh();
    } catch (error) {
      alert('Error recalculating scores. Please try again.');
      console.error('Recalculation error:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const allSelected = leads.length > 0 && selectedLeadIds.size === leads.length;
  const someSelected = selectedLeadIds.size > 0 && selectedLeadIds.size < leads.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                CCS Lead Agent
              </Link>
              <div className="flex gap-4">
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/companies"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Companies
                </Link>
                <Link
                  href="/dashboard/contacts"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Contacts
                </Link>
                <Link href="/dashboard/leads" className="text-sm font-medium text-blue-600">
                  Leads
                </Link>
                <Link
                  href="/dashboard/imports"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Imports
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{userEmail}</span>
              <Link
                href="/api/auth/signout"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <div className="flex gap-3">
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRecalculating ? 'Recalculating...' : 'Recalculate Scores'}
            </button>
            <Link
              href="/dashboard/leads/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Add Lead
            </Link>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status (multi-select) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                multiple
                size={4}
                value={localFilters.status || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  handleFilterChange({ status: selected.length > 0 ? selected : undefined });
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {ALLOWED_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                value={localFilters.assignedToId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({ assignedToId: value || undefined });
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Owners</option>
                <option value="unassigned">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Classification (multi-select) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
              <select
                multiple
                size={3}
                value={localFilters.classification || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  handleFilterChange({ classification: selected.length > 0 ? selected : undefined });
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Business Source (multi-select) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Source</label>
              <select
                multiple
                size={4}
                value={localFilters.businessSource || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  handleFilterChange({ businessSource: selected.length > 0 ? selected : undefined });
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="referral">Referral</option>
                <option value="existing_customer">Existing Customer</option>
                <option value="partner">Partner</option>
                <option value="inbound">Inbound</option>
                <option value="organic_social">Organic Social</option>
                <option value="paid_social">Paid Social</option>
                <option value="event">Event</option>
                <option value="email_campaign">Email Campaign</option>
                <option value="outbound">Outbound</option>
                <option value="unknown">Unknown</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Score Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.minScore ?? ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  handleFilterChange({ minScore: value });
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.maxScore ?? ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  handleFilterChange({ maxScore: value });
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Date Ranges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created After</label>
              <input
                type="date"
                value={localFilters.createdAfter ? localFilters.createdAfter.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const value = e.target.value ? new Date(e.target.value) : undefined;
                  handleFilterChange({ createdAfter: value });
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created Before</label>
              <input
                type="date"
                value={localFilters.createdBefore ? localFilters.createdBefore.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const value = e.target.value ? new Date(e.target.value) : undefined;
                  handleFilterChange({ createdBefore: value });
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={localSort.sortBy}
                onChange={(e) => handleSortChange({ sortBy: e.target.value as LeadSort['sortBy'] })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="score">Score</option>
                <option value="updatedAt">Last Updated</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={localSort.sortOrder}
                onChange={(e) => handleSortChange({ sortOrder: e.target.value as LeadSort['sortOrder'] })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* More Filters (Company) - Collapsible */}
          <div className="mt-4">
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showMoreFilters ? '▼' : '▶'} More Filters (Company)
            </button>
            {showMoreFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Country</label>
                  <select
                    multiple
                    size={4}
                    value={localFilters.companyCountry || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                      handleFilterChange({ companyCountry: selected.length > 0 ? selected : undefined });
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {companyCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Industry</label>
                  <select
                    multiple
                    size={4}
                    value={localFilters.companyIndustry || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                      handleFilterChange({ companyIndustry: selected.length > 0 ? selected : undefined });
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {companyIndustries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                  <select
                    multiple
                    size={4}
                    value={localFilters.companySize || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                      handleFilterChange({ companySize: selected.length > 0 ? selected : undefined });
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {companySizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedLeadIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900">
                  {selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? 's' : ''} selected
                </span>
                {bulkActionError && (
                  <span className="text-sm text-red-600">{bulkActionError}</span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'archive') {
                      setPendingBulkAction({ type: 'archive' });
                      setShowArchiveConfirm(true);
                    } else if (value === 'unarchive') {
                      handleBulkAction({ type: 'unarchive' });
                    } else if (value && value.startsWith('status:')) {
                      handleBulkAction({ type: 'status', value: value.replace('status:', '') });
                    } else if (value && value.startsWith('assign:')) {
                      handleBulkAction({ type: 'assign', value: value.replace('assign:', '') });
                    } else if (value === 'unassign') {
                      handleBulkAction({ type: 'unassign' });
                    }
                    e.target.value = '';
                  }}
                  disabled={isBulkActionLoading}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Bulk Actions...</option>
                  <option value="status:new">Set Status: New</option>
                  <option value="status:contacted">Set Status: Contacted</option>
                  <option value="status:qualified">Set Status: Qualified</option>
                  <option value="status:proposal">Set Status: Proposal</option>
                  <option value="status:negotiation">Set Status: Negotiation</option>
                  <option value="status:won">Set Status: Won</option>
                  <option value="status:lost">Set Status: Lost</option>
                  <option value="archive">Archive</option>
                  <option value="unarchive">Unarchive</option>
                  <option value="unassign">Unassign Owner</option>
                  {users.map(user => (
                    <option key={user.id} value={`assign:${user.id}`}>
                      Assign to: {user.name || user.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedLeadIds(new Set())}
                  className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {showArchiveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Archive</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to archive {selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? 's' : ''}? 
                Archived leads will be hidden from the default view.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowArchiveConfirm(false);
                    setPendingBulkAction(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkAction(pendingBulkAction)}
                  disabled={isBulkActionLoading}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isBulkActionLoading ? 'Archiving...' : 'Archive'}
                </button>
              </div>
            </div>
          </div>
        )}

        {leads.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or add a new lead.
            </p>
            <Link
              href="/dashboard/leads/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Add Lead
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someSelected;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.has(lead.id)}
                          onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {formatName(lead.firstName, lead.lastName)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {lead.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {lead.companyRel ? (
                          <Link
                            href={`/dashboard/companies/${lead.companyRel.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {lead.companyRel.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            lead.status
                          )}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {lead.assignedTo ? (lead.assignedTo.name || lead.assignedTo.email) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{lead.score}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.classification ? (
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getClassificationColor(
                              lead.classification
                            )}`}
                          >
                            {lead.classification}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {lead.businessSource || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/dashboard/leads/${lead.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="text-gray-600 hover:text-gray-800"
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
      </main>
    </div>
  );
}
