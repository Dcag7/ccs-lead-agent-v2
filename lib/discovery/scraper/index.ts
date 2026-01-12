/**
 * Discovery Scraper Module
 * 
 * Provides web scraping and content analysis for discovery.
 */

export { WebScraper, webScraper } from './WebScraper';
export type { ScrapedContent, ScrapeOptions } from './WebScraper';

export { ContentAnalyzer, contentAnalyzer } from './ContentAnalyzer';
export type { RelevanceScore, AnalysisConfig } from './ContentAnalyzer';
