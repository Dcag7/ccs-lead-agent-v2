"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Session } from "next-auth";

interface ImportJob {
  id: string;
  type: string;
  filename: string;
  rowsIn: number;
  rowsSuccess: number;
  rowsError: number;
  status: string;
  createdAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
}

interface Props {
  session: Session;
}

export default function ImportsClient({ session }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"company" | "contact" | "lead">("company");
  const [uploading, setUploading] = useState(false);
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchImports();
  }, []);

  const fetchImports = async () => {
    try {
      const response = await fetch("/api/imports");
      if (response.ok) {
        const data = await response.json();
        setImports(data.imports || []);
      }
    } catch (error) {
      console.error("Error fetching imports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
        setMessage(null);
      } else {
        setMessage({ type: "error", text: "Please select a CSV file" });
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a file" });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 10MB" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", importType);

      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Import completed! ${data.rowsSuccess} rows imported successfully, ${data.rowsError} errors.`,
        });
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        // Refresh imports list
        fetchImports();
      } else {
        setMessage({ type: "error", text: data.error || "Import failed" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred during upload" });
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "running":
        return "bg-[#E6F5F5] text-[#1B7A7A]";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CSV Imports</h1>
          <p className="text-gray-600">
            Import companies, contacts, and leads from CSV files.{" "}
            <a
              href="/docs/CSV_IMPORT_FORMATS.md"
              target="_blank"
              className="text-blue-600 hover:text-blue-800"
            >
              View format documentation →
            </a>
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload CSV File</h2>

          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="import-type" className="block text-sm font-medium text-gray-700 mb-2">
                Import Type
              </label>
              <select
                id="import-type"
                value={importType}
                onChange={(e) => setImportType(e.target.value as "company" | "contact" | "lead")}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={uploading}
              >
                <option value="company">Companies</option>
                <option value="contact">Contacts</option>
                <option value="lead">Leads</option>
              </select>
            </div>

            <div>
              <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
              </label>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#E6F5F5] file:text-[#1B7A7A] hover:file:bg-[#1B7A7A]/20"
                disabled={uploading}
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-[#1B7A7A] text-white px-6 py-3 rounded-md hover:bg-[#155555] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? "Uploading..." : "Upload and Import"}
            </button>
          </div>
        </div>

        {/* Import History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Import History</h2>
          </div>

          <div className="overflow-x-auto">
            {imports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No imports yet. Upload a CSV file to get started.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rows In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Errors
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Finished At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {imports.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {job.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            job.status
                          )}`}
                          title={job.errorMessage || ""}
                        >
                          {job.status}
                        </span>
                        {job.status === "failed" && job.errorMessage && (
                          <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={job.errorMessage}>
                            {job.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.rowsIn}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {job.rowsSuccess}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{job.rowsError}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.finishedAt ? formatDate(job.finishedAt) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
