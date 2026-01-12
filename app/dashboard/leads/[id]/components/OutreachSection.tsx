"use client";

import { useState, useEffect } from "react";

interface Playbook {
  id: string;
  name: string;
  audienceType: string;
  subjectTemplate?: string | null;
}

interface Draft {
  id: string;
  leadId: string;
  playbookId: string;
  playbook: Playbook;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface OutreachSectionProps {
  leadId: string;
}

export default function OutreachSection({ leadId }: OutreachSectionProps) {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Load playbooks
  useEffect(() => {
    async function loadPlaybooks() {
      try {
        const res = await fetch("/api/outreach/playbooks");
        if (!res.ok) throw new Error("Failed to load playbooks");
        const data = await res.json();
        setPlaybooks(data.playbooks || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load playbooks");
      }
    }
    loadPlaybooks();
  }, []);

  // Load drafts for this lead
  useEffect(() => {
    async function loadDrafts() {
      try {
        const res = await fetch(`/api/outreach/drafts?leadId=${leadId}`);
        if (!res.ok) throw new Error("Failed to load drafts");
        const data = await res.json();
        setDrafts(data.drafts || []);
      } catch (err) {
        console.error("Failed to load drafts:", err);
      }
    }
    loadDrafts();
  }, [leadId]);

  const handleGenerate = async () => {
    if (!selectedPlaybookId) {
      setError("Please select a playbook");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          playbookId: selectedPlaybookId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate draft");
      }

      const data = await res.json();
      
      // Reload drafts
      const draftsRes = await fetch(`/api/outreach/drafts?leadId=${leadId}`);
      if (draftsRes.ok) {
        const draftsData = await draftsRes.json();
        setDrafts(draftsData.drafts || []);
      }

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        alert(`Draft generated with warnings:\n${data.warnings.join("\n")}`);
      } else {
        alert("Draft generated successfully!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate draft");
    } finally {
      setGenerating(false);
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
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Outreach</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Generate Draft */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Generate Draft</h4>
        <div className="flex gap-3">
          <select
            value={selectedPlaybookId}
            onChange={(e) => setSelectedPlaybookId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1B7A7A]"
          >
            <option value="">Select a playbook...</option>
            {playbooks.map((pb) => (
              <option key={pb.id} value={pb.id}>
                {pb.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!selectedPlaybookId || generating}
            className="px-4 py-2 bg-[#1B7A7A] text-white rounded-md hover:bg-[#155555] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {generating ? "Generating..." : "Generate Draft"}
          </button>
        </div>
      </div>

      {/* Drafts List */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Drafts</h4>
        {drafts.length === 0 ? (
          <p className="text-gray-600 text-sm">No drafts yet. Generate one above.</p>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div key={draft.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{draft.playbook.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created {new Date(draft.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(draft.status)}`}>
                    {draft.status}
                  </span>
                </div>
                {draft.subject && (
                  <p className="text-sm font-medium text-gray-700 mb-1">Subject: {draft.subject}</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-2">{draft.body.substring(0, 150)}...</p>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/dashboard/outreach/${draft.id}`}
                    className="text-sm text-[#1B7A7A] hover:text-[#155555] font-medium"
                  >
                    View & Edit →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
