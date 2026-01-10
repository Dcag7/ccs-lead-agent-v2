/**
 * Phase 1 Discovery - Main Exports
 * 
 * Exports for Phase 1 Discovery MVP
 */

// Types
export type * from './types';

// Channels
export { GoogleDiscoveryChannel, type GoogleDiscoveryChannelOptions } from './channels/google';
export { KeywordDiscoveryChannel, type KeywordDiscoveryChannelOptions } from './channels/keyword';
export type { IDiscoveryChannel } from './channels/IDiscoveryChannel';
export type { IGoogleDiscoveryChannel } from './channels/google/IGoogleDiscoveryChannel';
export type { IKeywordDiscoveryChannel } from './channels/keyword/IKeywordDiscoveryChannel';

// Signals
export { WebsiteSignalExtractor } from './signals';
export type { IWebsiteSignalExtractor } from './signals/IWebsiteSignalExtractor';

// Aggregator
export { DiscoveryAggregator, type DiscoveryAggregatorConfig, type DiscoveryAggregatorResult } from './DiscoveryAggregator';

// Persistence
export { persistDiscoveryResults, type PersistenceResult } from './persistDiscoveryResults';
