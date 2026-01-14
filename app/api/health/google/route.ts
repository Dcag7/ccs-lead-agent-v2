/**
 * Google CSE Health Check Endpoint
 * 
 * GET /api/health/google
 * 
 * Returns Google CSE configuration status (safe, never returns secrets).
 * Used for diagnostics and UI feedback.
 */

import { NextResponse } from 'next/server';
import { getConfigStatus } from '@/lib/discovery/google/googleConfig';

/**
 * GET - Check Google CSE configuration status
 */
export async function GET(): Promise<NextResponse> {
  try {
    const status = getConfigStatus();

    // Determine quota status (we can't check actual quota without making a request)
    // For now, return "unknown" - could be enhanced to test with a minimal query
    const quotaStatus: 'ok' | 'unknown' = status.configured ? 'unknown' : 'unknown';

    return NextResponse.json({
      configured: status.configured,
      apiKeyPresent: status.apiKeyPresent,
      cseIdPresent: status.cseIdPresent,
      quotaStatus,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        configured: false,
        apiKeyPresent: false,
        cseIdPresent: false,
        quotaStatus: 'unknown' as const,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
