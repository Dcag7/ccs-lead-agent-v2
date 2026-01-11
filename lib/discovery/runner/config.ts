/**
 * Phase 5A - Discovery Runner Configuration
 *
 * Loads configuration from environment variables with sensible defaults.
 */

import type { DiscoveryRunnerConfig } from './types';

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
    maxCompaniesPerRun: parseInt(
      process.env.DISCOVERY_MAX_COMPANIES_PER_RUN || '50',
      10
    ),
    maxQueries: parseInt(process.env.DISCOVERY_MAX_QUERIES || '10', 10),
    maxRuntimeSeconds: parseInt(
      process.env.DISCOVERY_MAX_RUNTIME_SECONDS || '300',
      10
    ),
    enabledChannels:
      enabledChannels.length > 0 ? enabledChannels : ['google', 'keyword'],
  };
}

/**
 * Get discovery queries (up to maxQueries)
 */
export function getDiscoveryQueries(maxQueries: number): string[] {
  return DEFAULT_DISCOVERY_QUERIES.slice(0, maxQueries);
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
