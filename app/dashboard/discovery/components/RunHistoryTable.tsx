'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface DiscoveryRun {
  id: string;
  status: string;
  mode: string;
  dryRun: boolean;
  intentId: string | null;
  intentName: string | null;
  triggeredBy: string | null;
  startedAt: string;
  finishedAt: string | null;
  createdCompaniesCount: number;
  createdContactsCount: number;
  createdLeadsCount: number;
  skippedCount: number;
  errorCount: number;
  stats: Record<string, unknown> | null;
  error: string | null;
}

interface Props {
  runs: DiscoveryRun[];
  onRefresh?: () => void;
  showArchived?: boolean;
  onToggleArchived?: () => void;
  onArchive?: (runId: string) => Promise<void>;
  onUnarchive?: (runId: string) => Promise<void>;
  onBulkArchive?: (runIds: string[]) => Promise<void>;
  onBulkUnarchive?: (runIds: string[]) => Promise<void>;
  onBulkDelete?: (runIds: string[]) => Promise<void>;
  onPrint?: (runIds: string[]) => void;
  allowDelete?: boolean; // Only true on archived runs page
}

function formatDuration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) return '-';
  const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${Math.floor(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status: string, dryRun: boolean) {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
  const statusClasses: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    completed_with_errors: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    running: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
      {dryRun && <span className="ml-1 text-gray-500">(preview)</span>}
    </span>
  );
}

export default function RunHistoryTable({
  runs,
  onRefresh,
  showArchived = false,
  onToggleArchived,
  onArchive,
  onUnarchive,
  onBulkArchive,
  onBulkUnarchive,
  onBulkDelete,
  onPrint,
  allowDelete = false,
}: Props) {
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showRowMenu, setShowRowMenu] = useState<string | null>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const rowMenuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(event.target as Node)) {
        setShowBulkMenu(false);
      }
      // Check row menus
      let clickedOutsideAll = true;
      rowMenuRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedOutsideAll = false;
        }
      });
      if (clickedOutsideAll) {
        setShowRowMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleArchive = async (runId: string) => {
    if (!onArchive) return;
    setArchivingId(runId);
    try {
      await onArchive(runId);
    } finally {
      setArchivingId(null);
    }
  };

  const handleUnarchive = async (runId: string) => {
    if (!onUnarchive) return;
    setArchivingId(runId);
    try {
      await onUnarchive(runId);
    } finally {
      setArchivingId(null);
    }
  };

  const getTriggeredByLabel = (triggeredBy: string | null) => {
    if (!triggeredBy) return 'unknown';
    if (triggeredBy === 'manual') return 'Manual';
    if (triggeredBy === 'cron') return 'Automated';
    if (triggeredBy === 'test-script') return 'Test';
    if (triggeredBy.includes('manual-ui')) return 'Manual';
    if (triggeredBy.includes('jobs/discovery')) return 'Automated';
    return triggeredBy;
  };

  const toggleSelection = (runId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(runId)) {
      newSelected.delete(runId);
    } else {
      newSelected.add(runId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === runs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(runs.map(r => r.id)));
    }
  };

  const handleBulkAction = async (action: 'archive' | 'unarchive' | 'delete' | 'print') => {
    const runIds = Array.from(selectedIds);
    if (runIds.length === 0) return;

    if (action === 'print' && onPrint) {
      onPrint(runIds);
      setShowBulkMenu(false);
      return;
    }

    try {
      if (action === 'archive' && onBulkArchive) {
        await onBulkArchive(runIds);
      } else if (action === 'unarchive' && onBulkUnarchive) {
        await onBulkUnarchive(runIds);
      } else if (action === 'delete' && onBulkDelete) {
        if (confirm(`Are you sure you want to permanently delete ${runIds.length} run(s)? This action cannot be undone.`)) {
          await onBulkDelete(runIds);
        }
      }
      setSelectedIds(new Set());
      setShowBulkMenu(false);
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
    }
  };

  const handleRowAction = async (runId: string, action: 'archive' | 'unarchive' | 'delete' | 'print') => {
    setShowRowMenu(null);
    
    if (action === 'print' && onPrint) {
      onPrint([runId]);
      return;
    }

    try {
      if (action === 'archive' && onArchive) {
        await onArchive(runId);
      } else if (action === 'unarchive' && onUnarchive) {
        await onUnarchive(runId);
      } else if (action === 'delete' && onBulkDelete) {
        if (confirm('Are you sure you want to permanently delete this run? This action cannot be undone.')) {
          await onBulkDelete([runId]);
        }
      }
    } catch (error) {
      console.error(`Row ${action} failed:`, error);
    }
  };

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Run History</h2>
        <div className="flex items-center gap-3">
          {hasSelection && (
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <span>Bulk Actions ({selectedCount})</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showBulkMenu && (
                <div ref={bulkMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {showArchived ? (
                      <>
                        {onBulkUnarchive && (
                          <button
                            onClick={() => handleBulkAction('unarchive')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Unarchive Selected
                          </button>
                        )}
                        {onBulkDelete && allowDelete && (
                          <button
                            onClick={() => handleBulkAction('delete')}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Delete Selected
                          </button>
                        )}
                      </>
                    ) : (
                      onBulkArchive && (
                        <button
                          onClick={() => handleBulkAction('archive')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Archive Selected
                        </button>
                      )
                    )}
                    {onPrint && (
                      <button
                        onClick={() => handleBulkAction('print')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Print Selected
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {onToggleArchived && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={onToggleArchived}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <span>Show archived</span>
            </label>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-teal-600 hover:text-teal-800"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === runs.length && runs.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Intent / Mode
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Triggered By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Started
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Results
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Errors
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {runs.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No discovery runs found
                </td>
              </tr>
            ) : (
              runs.map((run) => {
                const stats = run.stats as { durationMs?: number; totalAfterDedupe?: number } | null;
                const resultCount = run.dryRun
                  ? (stats?.totalAfterDedupe ?? 0)
                  : run.createdCompaniesCount;
                const isSelected = selectedIds.has(run.id);
                return (
                  <tr key={run.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-teal-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(run.id)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(run.status, run.dryRun)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {run.intentName || run.mode}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {getTriggeredByLabel(run.triggeredBy)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(run.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDuration(run.startedAt, run.finishedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {run.dryRun ? (
                        <span className="text-sm text-amber-600">
                          {stats?.totalAfterDedupe ?? 0} discovered
                        </span>
                      ) : (
                        <>
                          <div className="text-sm text-green-600">
                            {run.createdCompaniesCount} companies
                          </div>
                          {(run.createdContactsCount > 0 || run.createdLeadsCount > 0) && (
                            <div className="text-xs text-gray-500">
                              {run.createdContactsCount} contacts, {run.createdLeadsCount} leads
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {run.errorCount > 0 ? (
                        <span className="text-red-600">{run.errorCount}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 relative">
                        {resultCount > 0 && (
                          <Link
                            href={`/dashboard/discovery/runs/${run.id}`}
                            className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                          >
                            View
                          </Link>
                        )}
                        <div className="relative">
                          <button
                            onClick={() => setShowRowMenu(showRowMenu === run.id ? null : run.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="More actions"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {showRowMenu === run.id && (
                            <div
                              ref={(el) => {
                                if (el) rowMenuRefs.current.set(run.id, el);
                                else rowMenuRefs.current.delete(run.id);
                              }}
                              className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20"
                            >
                              <div className="py-1">
                                {showArchived ? (
                                  <>
                                    {onUnarchive && (
                                      <button
                                        onClick={() => handleRowAction(run.id, 'unarchive')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Unarchive
                                      </button>
                                    )}
                                    {onBulkDelete && allowDelete && (
                                      <button
                                        onClick={() => handleRowAction(run.id, 'delete')}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  onArchive && (
                                    <button
                                      onClick={() => handleRowAction(run.id, 'archive')}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Archive
                                    </button>
                                  )
                                )}
                                {onPrint && (
                                  <button
                                    onClick={() => handleRowAction(run.id, 'print')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Print
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
