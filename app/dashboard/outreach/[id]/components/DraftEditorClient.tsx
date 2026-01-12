"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  };
}

interface DraftEditorClientProps {
  draft: Draft;
  currentUserId: string | null; // eslint-disable-line @typescript-eslint/no-unused-vars
}

export default function DraftEditorClient({ draft: initialDraft, currentUserId }: DraftEditorClientProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [subject, setSubject] = useState(draft.subject || "");
  const [body, setBody] = useState(draft.body);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/outreach/drafts/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject || null,
          body: body,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save draft");
      }

      const data = await res.json();
      setDraft(data.draft);
      alert("Draft saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("Approve this draft? It will be moved to the approved queue and ready to send.")) {
      return;
    }

    setApproving(true);
    setError(null);

    try {
      const res = await fetch(`/api/outreach/drafts/${draft.id}/approve`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve draft");
      }

      const data = await res.json();
      setDraft(data.draft);
      alert("Draft approved successfully!");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve draft");
    } finally {
      setApproving(false);
    }
  };

  const handleSend = async () => {
    if (!confirm("Are you sure you want to send this draft? This action cannot be undone.")) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.reason || "Failed to send draft");
      }

      alert("Draft sent successfully!");
      router.push("/dashboard/outreach");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send draft");
    } finally {
      setSending(false);
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

  return (
    <div className="px-6 py-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Status */}
      <div className="mb-6">
        <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(draft.status)}`}>
          {draft.status}
        </span>
      </div>

      {/* Warnings from metadata */}
      {draft.metadata && typeof draft.metadata === 'object' && 'warnings' in draft.metadata && Array.isArray(draft.metadata.warnings) && draft.metadata.warnings.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
          <ul className="list-disc list-inside text-sm text-yellow-700">
            {(draft.metadata.warnings as string[]).map((warning: string, idx: number) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Subject */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B7A7A]"
          placeholder="Email subject line"
          disabled={draft.status === "sent"}
        />
      </div>

      {/* Body */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B7A7A] font-mono text-sm"
          placeholder="Email body"
          disabled={draft.status === "sent"}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {draft.status !== "sent" && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
        )}
        {draft.status === "draft" && (
          <button
            onClick={handleApprove}
            disabled={approving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {approving ? "Approving..." : "Approve"}
          </button>
        )}
        {draft.status === "approved" && (
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        )}
      </div>
    </div>
  );
}
