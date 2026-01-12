"use client";

import { useState } from "react";
import Link from "next/link";

interface Draft {
  id: string;
  leadId: string;
  playbookId: string;
  playbook: {
    id: string;
    name: string;
    audienceType: string;
  };
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  lead: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyRel: {
      name: string;
    } | null;
  };
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  approvedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface OutreachQueueClientProps {
  initialDrafts: Draft[];
  currentUserId: string | null; // eslint-disable-line @typescript-eslint/no-unused-vars
}

export default function OutreachQueueClient({ initialDrafts, currentUserId }: OutreachQueueClientProps) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (draftId: string) => {
    setLoading(draftId);
    try {
      const res = await fetch(`/api/outreach/drafts/${draftId}/approve`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to approve draft");
        return;
      }

      // Reload drafts
      const draftsRes = await fetch(`/api/outreach/drafts?status=${statusFilter === "all" ? "" : statusFilter}`);
      if (draftsRes.ok) {
        const data = await draftsRes.json();
        setDrafts(data.drafts || []);
      }
    } catch {
      alert("Failed to approve draft");
    } finally {
      setLoading(null);
    }
  };

  const handleSend = async (draftId: string) => {
    if (!confirm("Are you sure you want to send this draft? This action cannot be undone.")) {
      return;
    }

    setLoading(draftId);
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || data.reason || "Failed to send draft");
        return;
      }

      // Reload drafts
      const draftsRes = await fetch(`/api/outreach/drafts?status=${statusFilter === "all" ? "" : statusFilter}`);
      if (draftsRes.ok) {
        const data = await draftsRes.json();
        setDrafts(data.drafts || []);
      }

      alert("Draft sent successfully!");
    } catch {
      alert("Failed to send draft");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async (draftId: string) => {
    if (!confirm("Are you sure you want to cancel this draft?")) {
      return;
    }

    setLoading(draftId);
    try {
      const res = await fetch(`/api/outreach/drafts/${draftId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to cancel draft");
        return;
      }

      // Reload drafts
      const draftsRes = await fetch(`/api/outreach/drafts?status=${statusFilter === "all" ? "" : statusFilter}`);
      if (draftsRes.ok) {
        const data = await draftsRes.json();
        setDrafts(data.drafts || []);
      }
    } catch {
      alert("Failed to cancel draft");
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      approved: "bg-blue-100 text-blue-800",
      sent: "bg-green-100 text-green-800",
      cancelled: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredDrafts = statusFilter === "all" ? drafts : drafts.filter((d) => d.status === statusFilter);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === "all"
              ? "bg-[#1B7A7A] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("draft")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === "draft"
              ? "bg-[#1B7A7A] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Draft
        </button>
        <button
          onClick={() => setStatusFilter("approved")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === "approved"
              ? "bg-[#1B7A7A] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter("sent")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === "sent"
              ? "bg-[#1B7A7A] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Sent
        </button>
      </div>

      {/* Drafts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Playbook
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrafts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No drafts found
                </td>
              </tr>
            ) : (
              filteredDrafts.map((draft) => (
                <tr key={draft.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/leads/${draft.leadId}`}
                      className="text-sm font-medium text-[#1B7A7A] hover:text-[#155555]"
                    >
                      {draft.lead.firstName || draft.lead.lastName
                        ? `${draft.lead.firstName || ""} ${draft.lead.lastName || ""}`.trim()
                        : draft.lead.email}
                    </Link>
                    <p className="text-xs text-gray-500">{draft.lead.email}</p>
                    {draft.lead.companyRel && (
                      <p className="text-xs text-gray-400">{draft.lead.companyRel.name}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {draft.playbook.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {draft.subject || "(no subject)"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(draft.status)}`}>
                      {draft.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(draft.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/outreach/${draft.id}`}
                        className="text-[#1B7A7A] hover:text-[#155555]"
                      >
                        View
                      </Link>
                      {draft.status === "draft" && (
                        <button
                          onClick={() => handleApprove(draft.id)}
                          disabled={loading === draft.id}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          {loading === draft.id ? "..." : "Approve"}
                        </button>
                      )}
                      {draft.status === "approved" && (
                        <button
                          onClick={() => handleSend(draft.id)}
                          disabled={loading === draft.id}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          {loading === draft.id ? "..." : "Send"}
                        </button>
                      )}
                      {draft.status !== "sent" && draft.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancel(draft.id)}
                          disabled={loading === draft.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {loading === draft.id ? "..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
