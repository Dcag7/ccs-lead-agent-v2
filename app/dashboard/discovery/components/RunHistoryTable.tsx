'use client';

import { useState } from 'react';
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
}: Props) {
  const [archivingId, setArchivingId] = useState<string | null>(null);

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
    if (triggeredBy === 'cron') return 'Scheduled';
    if (triggeredBy === 'test-script') return 'Test';
    return triggeredBy;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Run History</h2>
        <div className="flex items-center gap-3">
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
                  colSpan={8}
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
                return (
                  <tr key={run.id} className="hover:bg-gray-50">
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
                      <div className="flex items-center gap-2">
                        {resultCount > 0 && (
                          <Link
                            href={`/dashboard/discovery/runs/${run.id}`}
                            className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                          >
                            View
                          </Link>
                        )}
                        {resultCount === 0 && run.status !== 'running' && run.status !== 'pending' && (
                          <>
                            {onArchive && (
                              <button
                                onClick={() => handleArchive(run.id)}
                                disabled={archivingId === run.id}
                                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                title="Archive this run"
                              >
                                {archivingId === run.id ? 'Archiving...' : 'Archive'}
                              </button>
                            )}
                            {onUnarchive && showArchived && (
                              <button
                                onClick={() => handleUnarchive(run.id)}
                                disabled={archivingId === run.id}
                                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                title="Unarchive this run"
                              >
                                {archivingId === run.id ? 'Unarchiving...' : 'Unarchive'}
                              </button>
                            )}
                          </>
                        )}
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
