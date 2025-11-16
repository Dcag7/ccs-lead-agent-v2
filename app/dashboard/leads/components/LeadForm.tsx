"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LeadFormProps {
  lead?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    country: string | null;
    status: string;
    score: number;
    source: string | null;
    companyId: string | null;
    contactId: string | null;
  };
  mode: "create" | "edit";
}

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  companyId: string | null;
}

export default function LeadForm({ lead, mode }: LeadFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: lead?.email || "",
    firstName: lead?.firstName || "",
    lastName: lead?.lastName || "",
    phone: lead?.phone || "",
    country: lead?.country || "",
    status: lead?.status || "new",
    score: lead?.score || 0,
    source: lead?.source || "",
    companyId: lead?.companyId || "",
    contactId: lead?.contactId || "",
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch companies and contacts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, contactsRes] = await Promise.all([
          fetch("/api/companies"),
          fetch("/api/contacts"),
        ]);

        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData.companies || []);
        }

        if (contactsRes.ok) {
          const contactsData = await contactsRes.json();
          setContacts(contactsData.contacts || []);
          setFilteredContacts(contactsData.contacts || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // Filter contacts when company changes
  useEffect(() => {
    if (formData.companyId) {
      const filtered = contacts.filter(
        (contact) => contact.companyId === formData.companyId
      );
      setFilteredContacts(filtered);
      
      // Reset contact if it doesn't belong to selected company
      if (formData.contactId) {
        const contactBelongsToCompany = filtered.some(
          (c) => c.id === formData.contactId
        );
        if (!contactBelongsToCompany) {
          setFormData((prev) => ({ ...prev, contactId: "" }));
        }
      }
    } else {
      setFilteredContacts(contacts);
    }
  }, [formData.companyId, contacts, formData.contactId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = mode === "create" 
        ? "/api/leads" 
        : `/api/leads/${lead?.id}`;
      
      const method = mode === "create" ? "POST" : "PUT";

      // Convert empty strings to null for optional fields
      const payload = {
        ...formData,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        phone: formData.phone || null,
        country: formData.country || null,
        source: formData.source || null,
        companyId: formData.companyId || null,
        contactId: formData.contactId || null,
        score: parseInt(formData.score.toString()),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save lead");
      }

      router.push("/dashboard/leads");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a country</option>
            <option value="South Africa">South Africa</option>
            <option value="Botswana">Botswana</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label htmlFor="score" className="block text-sm font-medium text-gray-700">
            Score (0-100)
          </label>
          <input
            type="number"
            id="score"
            name="score"
            min="0"
            max="100"
            value={formData.score}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700">
          Source
        </label>
        <input
          type="text"
          id="source"
          name="source"
          value={formData.source}
          onChange={handleChange}
          placeholder="e.g., Website, Referral, LinkedIn"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">
            Company
          </label>
          <select
            id="companyId"
            name="companyId"
            value={formData.companyId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contactId" className="block text-sm font-medium text-gray-700">
            Contact {formData.companyId && "(filtered by company)"}
          </label>
          <select
            id="contactId"
            name="contactId"
            value={formData.contactId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a contact</option>
            {filteredContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName || contact.lastName
                  ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                  : contact.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Saving..." : mode === "create" ? "Create Lead" : "Update Lead"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
