/**
 * Phase 5A - Discovery Runner Configuration
 *
 * Loads configuration from environment variables with sensible defaults.
 * 
 * API Quota Management:
 * - Google CSE free tier: 100 queries/day
 * - Each discovery run scrapes ~10 sites per query
 * - Limits set to conserve quota while still being useful
 * 
 * Daily runs execute multiple intents sequentially with conservative limits.
 */

import type { DiscoveryRunnerConfig } from './types';
import { DEFAULT_DAILY_INTENTS } from '../intents/catalog';

/**
 * Discovery limits by mode
 * These limits help conserve API quota
 */
export const DISCOVERY_LIMITS = {
  /** Daily automated discovery - runs once per day via cron */
  daily: {
    maxCompanies: 30,  // Max 30 companies per day (total across all intents)
    maxLeads: 30,      // Max 30 leads per day (total across all intents)
    maxQueries: 5,     // Limit queries per intent to conserve API quota
  },
  /** Per-intent limits for daily runs */
  dailyPerIntent: {
    maxCompanies: 10,  // Max 10 companies per intent
    maxLeads: 10,      // Max 10 leads per intent
    maxQueries: 2,     // 2 queries per intent to stay within quota
  },
  /** Manual discovery - triggered by admin */
  manual: {
    maxCompanies: 10,  // Max 10 companies per manual run
    maxLeads: 10,      // Max 10 leads per manual run
    maxQueries: 3,     // Fewer queries for manual runs
  },
} as const;

/**
 * Default discovery queries for MVP
 * These are hardcoded for Phase 5A; will be configurable in Phase 5B
 */
export const DEFAULT_DISCOVERY_QUERIES = [
  'corporate clothing suppliers South Africa',
  'workwear manufacturers Johannesburg',
  'promotional clothing companies Cape Town',
  'uniform suppliers Botswana',
  'branded apparel South Africa',
  'corporate gifts Pretoria',
  'school uniform manufacturers South Africa',
  'hospitality uniforms Cape Town',
  'construction workwear suppliers',
  'branded merchandise companies Gauteng',
];

/**
 * Load discovery runner configuration from environment variables
 */
export function loadConfig(): DiscoveryRunnerConfig {
  const channelsEnv = process.env.DISCOVERY_CHANNELS || 'google,keyword';
  const enabledChannels = channelsEnv
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter((c): c is 'google' | 'keyword' => c === 'google' || c === 'keyword');

  return {
    enabled: process.env.DISCOVERY_RUNNER_ENABLED === 'true',
    // Default to daily limits (can be overridden per run)
    maxCompaniesPerRun: parseInt(
      process.env.DISCOVERY_MAX_COMPANIES_PER_RUN || String(DISCOVERY_LIMITS.daily.maxCompanies),
      10
    ),
    maxLeadsPerRun: parseInt(
      process.env.DISCOVERY_MAX_LEADS_PER_RUN || String(DISCOVERY_LIMITS.daily.maxLeads),
      10
    ),
    maxQueries: parseInt(
      process.env.DISCOVERY_MAX_QUERIES || String(DISCOVERY_LIMITS.daily.maxQueries),
      10
    ),
    maxPagesPerQuery: parseInt(
      process.env.DISCOVERY_MAX_PAGES_PER_QUERY || '2',
      10
    ),
    maxRuntimeSeconds: parseInt(
      process.env.DISCOVERY_MAX_RUNTIME_SECONDS || '60',
      10
    ),
    enabledChannels:
      enabledChannels.length > 0 ? enabledChannels : ['google', 'keyword'],
  };
}

/**
 * Get limits for a specific mode
 */
export function getLimitsForMode(mode: 'daily' | 'manual' | 'test'): {
  maxCompanies: number;
  maxLeads: number;
  maxQueries: number;
} {
  if (mode === 'manual' || mode === 'test') {
    return DISCOVERY_LIMITS.manual;
  }
  return DISCOVERY_LIMITS.daily;
}

/**
 * Get discovery queries (up to maxQueries)
 */
export function getDiscoveryQueries(maxQueries: number): string[] {
  return DEFAULT_DISCOVERY_QUERIES.slice(0, maxQueries);
}

/**
 * Get default intent IDs for daily runs
 * Can be overridden via DISCOVERY_DAILY_INTENTS env var (comma-separated)
 */
export function getDailyIntentIds(): string[] {
  const envIntents = process.env.DISCOVERY_DAILY_INTENTS;
  if (envIntents) {
    return envIntents.split(',').map((id) => id.trim()).filter(Boolean);
  }
  return DEFAULT_DAILY_INTENTS;
}

/**
 * Get limits for daily per-intent runs
 */
export function getDailyPerIntentLimits(): {
  maxCompanies: number;
  maxLeads: number;
  maxQueries: number;
} {
  return {
    maxCompanies: parseInt(process.env.DISCOVERY_DAILY_MAX_COMPANIES_PER_INTENT || '10', 10),
    maxLeads: parseInt(process.env.DISCOVERY_DAILY_MAX_LEADS_PER_INTENT || '10', 10),
    maxQueries: parseInt(process.env.DISCOVERY_DAILY_MAX_QUERIES_PER_INTENT || '2', 10),
  };
}

/**
 * Simple time budget tracker
 */
export class TimeBudget {
  private startTime: number;
  private maxMs: number;

  constructor(maxSeconds: number) {
    this.startTime = Date.now();
    this.maxMs = maxSeconds * 1000;
  }

  isExpired(): boolean {
    return Date.now() - this.startTime > this.maxMs;
  }

  remainingMs(): number {
    return Math.max(0, this.maxMs - (Date.now() - this.startTime));
  }

  elapsedMs(): number {
    return Date.now() - this.startTime;
  }
}
