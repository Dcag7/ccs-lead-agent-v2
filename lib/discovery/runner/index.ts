/**
 * Phase 5A - Discovery Runner Public Exports
 */

export { DailyDiscoveryRunner, discoveryRunner } from './DailyDiscoveryRunner';
export { 
  loadConfig, 
  getDiscoveryQueries, 
  TimeBudget, 
  DEFAULT_DISCOVERY_QUERIES,
  getLimitsForMode,
  DISCOVERY_LIMITS,
} from './config';
export type {
  DiscoveryRunnerConfig,
  RunOptions,
  RunResult,
  DiscoveryRunStats,
  DiscoveryJobRequest,
  DiscoveryJobResponse,
  DiscoveryJobErrorResponse,
} from './types';
