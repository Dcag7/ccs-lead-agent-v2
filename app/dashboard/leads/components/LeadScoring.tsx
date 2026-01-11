'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LeadScoringProps {
  leadId: string;
  currentBusinessSource: string | null;
  currentScore: number;
  currentClassification: string | null;
  currentScoredAt: Date | null;
}

const BUSINESS_SOURCES = [
  { value: '', label: '(Not Set)' },
  { value: 'referral', label: 'Referral' },
  { value: 'existing_customer', label: 'Existing Customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'organic_social', label: 'Organic Social' },
  { value: 'paid_social', label: 'Paid Social' },
  { value: 'event', label: 'Event' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'unknown', label: 'Unknown' },
];

export default function LeadScoring({
  leadId,
  currentBusinessSource,
  currentScore,
  currentClassification,
  currentScoredAt,
}: LeadScoringProps) {
  const router = useRouter();
  const [businessSource, setBusinessSource] = useState(currentBusinessSource || '');
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getClassificationColor = (classification: string | null) => {
    switch (classification) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-yellow-100 text-yellow-800';
      case 'cold':
        return 'bg-[#E6F5F5] text-[#1B7A7A]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleScore = async () => {
    setIsScoring(true);
    setError(null);

    try {
      const body: { leadId: string; businessSource?: string } = { leadId };
      if (businessSource) {
        body.businessSource = businessSource;
      }

      const response = await fetch('/api/scoring/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to score lead');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Scoring error:', err);
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Scoring</h3>

        {/* Business Source Dropdown */}
        <div className="mb-4">
          <label htmlFor="businessSource" className="block text-sm font-medium text-gray-700 mb-2">
            Business Source
          </label>
          <select
            id="businessSource"
            value={businessSource}
            onChange={(e) => setBusinessSource(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {BUSINESS_SOURCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Business/acquisition source used for scoring and segmentation
          </p>
        </div>

        {/* Score Now Button */}
        <div className="mb-4">
          <button
            onClick={handleScore}
            disabled={isScoring}
            className="bg-[#1B7A7A] text-white px-4 py-2 rounded-md hover:bg-[#155555] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScoring ? 'Scoring...' : 'Score Now'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Current Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Score</h4>
            <p className="text-2xl font-bold text-blue-600">{currentScore}/100</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Classification</h4>
            {currentClassification ? (
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getClassificationColor(
                  currentClassification
                )}`}
              >
                {currentClassification}
              </span>
            ) : (
              <p className="text-gray-400 text-sm">Not scored</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Last Scored</h4>
            <p className="text-sm text-gray-900">
              {currentScoredAt ? new Date(currentScoredAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
